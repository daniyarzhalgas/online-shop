package kz.sdu.advanceddb.service;

import tools.jackson.databind.ObjectMapper;
import kz.sdu.advanceddb.dto.RecommendationItem;
import kz.sdu.advanceddb.model.Interaction;
import kz.sdu.advanceddb.model.Product;
import kz.sdu.advanceddb.repository.InteractionRepository;
import kz.sdu.advanceddb.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final InteractionRepository interactionRepository;
    private final ProductRepository productRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "recommendations:";
    private static final Duration CACHE_TTL = Duration.ofHours(1);

    private static final Map<Interaction.InteractionType, Double> WEIGHTS = Map.of(
            Interaction.InteractionType.VIEW, 1.0,
            Interaction.InteractionType.ADD_TO_CART, 2.0,
            Interaction.InteractionType.PURCHASE, 3.0,
            Interaction.InteractionType.RATING, 1.0
    );

    public List<RecommendationItem> getRecommendations(String userId, int limit) {
        String cacheKey = CACHE_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                RecommendationItem[] arr = objectMapper.readValue(cached, RecommendationItem[].class);
                log.debug("Recommendations served from cache for user {}", userId);
                return new ArrayList<>(Arrays.asList(arr));
            } catch (Exception e) {
                log.warn("Failed to deserialize cached recommendations for user {}", userId);
            }
        }

        long start = System.currentTimeMillis();
        List<RecommendationItem> recommendations = compute(userId, limit);
        log.info("Recommendations computed in {}ms for user {}", System.currentTimeMillis() - start, userId);

        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(recommendations), CACHE_TTL);
        } catch (Exception e) {
            log.warn("Failed to cache recommendations for user {}", userId);
        }

        return recommendations;
    }

    private List<RecommendationItem> compute(String userId, int limit) {
        List<Interaction> userInteractions = interactionRepository.findByUserId(userId);

        if (userInteractions.isEmpty()) {
            return productRepository.findAll().stream()
                    .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                    .limit(limit)
                    .map(p -> RecommendationItem.builder()
                            .product(p)
                            .score(p.getAverageRating())
                            .reason("Popular & highly rated")
                            .fromCollaborativeFiltering(false)
                            .build())
                    .collect(Collectors.toList());
        }

        Set<String> userProductIds = userInteractions.stream()
                .map(Interaction::getProductId)
                .collect(Collectors.toSet());

        // Build user interaction vector for cosine similarity
        Map<String, Double> userVector = buildVector(userInteractions);

        // Find similar users — those who interacted with the same products
        Set<String> similarUserIds = new HashSet<>();
        for (String productId : userProductIds) {
            interactionRepository.findByProductId(productId).stream()
                    .map(Interaction::getUserId)
                    .filter(uid -> !uid.equals(userId))
                    .forEach(similarUserIds::add);
        }

        if (similarUserIds.isEmpty()) {
            return fallback(userInteractions, userProductIds, limit);
        }

        // Score candidate products using weighted collaborative signal
        Map<String, Double> scoreMap = new HashMap<>();
        for (String similarUserId : similarUserIds) {
            List<Interaction> similarUserInteractions = interactionRepository.findByUserId(similarUserId);
            Map<String, Double> similarVector = buildVector(similarUserInteractions);
            double similarity = cosineSimilarity(userVector, similarVector);
            if (similarity <= 0) continue;

            for (Interaction i : similarUserInteractions) {
                if (userProductIds.contains(i.getProductId())) continue;
                double weight = getInteractionWeight(i) * similarity;
                scoreMap.merge(i.getProductId(), weight, Double::sum);
            }
        }

        if (scoreMap.isEmpty()) {
            return fallback(userInteractions, userProductIds, limit);
        }

        List<Map.Entry<String, Double>> topEntries = scoreMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toList());

        List<String> topIds = topEntries.stream().map(Map.Entry::getKey).collect(Collectors.toList());
        Map<String, Product> productMap = productRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, Double> scoreRef = topEntries.stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        List<RecommendationItem> result = topIds.stream()
                .map(id -> {
                    Product p = productMap.get(id);
                    if (p == null) return null;
                    return RecommendationItem.builder()
                            .product(p)
                            .score(Math.round(scoreRef.getOrDefault(id, 0.0) * 100.0) / 100.0)
                            .reason("Users with similar taste liked this")
                            .fromCollaborativeFiltering(true)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (result.size() < limit) {
            List<RecommendationItem> extra = fallback(userInteractions, userProductIds, limit - result.size());
            Set<String> included = result.stream().map(r -> r.getProduct().getId()).collect(Collectors.toSet());
            extra.stream().filter(r -> !included.contains(r.getProduct().getId())).forEach(result::add);
        }

        return result;
    }

    public List<RecommendationItem> getSimilarProducts(String productId, int limit) {
        List<Interaction> productInteractions = interactionRepository.findByProductId(productId);
        Set<String> userIds = productInteractions.stream()
                .map(Interaction::getUserId)
                .collect(Collectors.toSet());

        Map<String, Double> scoreMap = new HashMap<>();
        for (String uid : userIds) {
            for (Interaction i : interactionRepository.findByUserId(uid)) {
                if (i.getProductId().equals(productId)) continue;
                scoreMap.merge(i.getProductId(), getInteractionWeight(i), Double::sum);
            }
        }

        if (scoreMap.isEmpty()) {
            Product thisProduct = productRepository.findById(productId).orElse(null);
            if (thisProduct == null) return List.of();
            return productRepository.findByCategoryIgnoreCase(thisProduct.getCategory()).stream()
                    .filter(p -> !p.getId().equals(productId))
                    .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                    .limit(limit)
                    .map(p -> RecommendationItem.builder()
                            .product(p)
                            .score(p.getAverageRating())
                            .reason("Same category: " + p.getCategory())
                            .fromCollaborativeFiltering(false)
                            .build())
                    .collect(Collectors.toList());
        }

        List<String> topIds = scoreMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Map<String, Product> productMap = productRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        return topIds.stream()
                .map(id -> {
                    Product p = productMap.get(id);
                    if (p == null) return null;
                    return RecommendationItem.builder()
                            .product(p)
                            .score(Math.round(scoreMap.getOrDefault(id, 0.0) * 100.0) / 100.0)
                            .reason("Frequently bought together")
                            .fromCollaborativeFiltering(true)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<RecommendationItem> fallback(List<Interaction> userInteractions, Set<String> excludeIds, int limit) {
        Set<String> interactedIds = userInteractions.stream()
                .map(Interaction::getProductId)
                .collect(Collectors.toSet());
        Set<String> preferredCategories = productRepository.findAllById(interactedIds).stream()
                .map(Product::getCategory)
                .collect(Collectors.toSet());

        List<RecommendationItem> result = productRepository.findAll().stream()
                .filter(p -> !excludeIds.contains(p.getId()))
                .filter(p -> preferredCategories.contains(p.getCategory()))
                .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                .limit(limit)
                .map(p -> RecommendationItem.builder()
                        .product(p)
                        .score(p.getAverageRating())
                        .reason("Highly rated in " + p.getCategory())
                        .fromCollaborativeFiltering(false)
                        .build())
                .collect(Collectors.toList());

        if (result.isEmpty()) {
            return productRepository.findAll().stream()
                    .filter(p -> !excludeIds.contains(p.getId()))
                    .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                    .limit(limit)
                    .map(p -> RecommendationItem.builder()
                            .product(p)
                            .score(p.getAverageRating())
                            .reason("Popular & highly rated")
                            .fromCollaborativeFiltering(false)
                            .build())
                    .collect(Collectors.toList());
        }

        return result;
    }

    // Build interaction vector: productId -> weighted score
    private Map<String, Double> buildVector(List<Interaction> interactions) {
        Map<String, Double> vector = new HashMap<>();
        for (Interaction i : interactions) {
            vector.merge(i.getProductId(), getInteractionWeight(i), Double::sum);
        }
        return vector;
    }

    // Cosine similarity between two user vectors
    private double cosineSimilarity(Map<String, Double> v1, Map<String, Double> v2) {
        double dot = 0, mag1 = 0, mag2 = 0;
        for (Map.Entry<String, Double> e : v1.entrySet()) {
            dot += e.getValue() * v2.getOrDefault(e.getKey(), 0.0);
            mag1 += e.getValue() * e.getValue();
        }
        for (double val : v2.values()) {
            mag2 += val * val;
        }
        if (mag1 == 0 || mag2 == 0) return 0;
        return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
    }

    private double getInteractionWeight(Interaction i) {
        if (i.getType() == Interaction.InteractionType.RATING && i.getRating() != null) {
            return i.getRating();
        }
        return WEIGHTS.getOrDefault(i.getType(), 1.0);
    }

    public void evictCache(String userId) {
        redisTemplate.delete(CACHE_PREFIX + userId);
        log.debug("Evicted recommendation cache for user {}", userId);
    }
}
