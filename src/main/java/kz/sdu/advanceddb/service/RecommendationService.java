package kz.sdu.advanceddb.service;

import tools.jackson.databind.ObjectMapper;
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

    public List<Product> getRecommendations(String userId, int limit) {
        String cacheKey = CACHE_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                Product[] arr = objectMapper.readValue(cached, Product[].class);
                log.debug("Recommendations served from cache for user {}", userId);
                return new ArrayList<>(Arrays.asList(arr));
            } catch (Exception e) {
                log.warn("Failed to deserialize cached recommendations for user {}", userId);
            }
        }

        long start = System.currentTimeMillis();
        List<Product> recommendations = compute(userId, limit);
        log.info("Recommendations computed in {}ms (uncached) for user {}", System.currentTimeMillis() - start, userId);

        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(recommendations), CACHE_TTL);
        } catch (Exception e) {
            log.warn("Failed to cache recommendations for user {}", userId);
        }

        return recommendations;
    }

    private List<Product> compute(String userId, int limit) {
        List<Interaction> userInteractions = interactionRepository.findByUserId(userId);

        if (userInteractions.isEmpty()) {
            return productRepository.findAll().stream()
                    .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        Set<String> userProductIds = userInteractions.stream()
                .map(Interaction::getProductId)
                .collect(Collectors.toSet());

        // Find similar users — users who interacted with the same products
        Set<String> similarUserIds = new HashSet<>();
        for (String productId : userProductIds) {
            interactionRepository.findByProductId(productId).stream()
                    .map(Interaction::getUserId)
                    .filter(uid -> !uid.equals(userId))
                    .forEach(similarUserIds::add);
        }

        // Score candidate products from similar users
        Map<String, Double> scoreMap = new HashMap<>();
        for (String similarUserId : similarUserIds) {
            for (Interaction i : interactionRepository.findByUserId(similarUserId)) {
                if (userProductIds.contains(i.getProductId())) continue;
                double weight = WEIGHTS.getOrDefault(i.getType(), 1.0);
                if (i.getType() == Interaction.InteractionType.RATING && i.getRating() != null) {
                    weight = i.getRating();
                }
                scoreMap.merge(i.getProductId(), weight, Double::sum);
            }
        }

        List<String> topIds = scoreMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        if (topIds.isEmpty()) {
            return fallback(userInteractions, userProductIds, limit);
        }

        Map<String, Product> productMap = productRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        return topIds.stream()
                .map(productMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<Product> fallback(List<Interaction> userInteractions, Set<String> excludeIds, int limit) {
        Set<String> interactedIds = userInteractions.stream()
                .map(Interaction::getProductId)
                .collect(Collectors.toSet());
        Set<String> preferredCategories = productRepository.findAllById(interactedIds).stream()
                .map(Product::getCategory)
                .collect(Collectors.toSet());

        return productRepository.findAll().stream()
                .filter(p -> !excludeIds.contains(p.getId()))
                .filter(p -> preferredCategories.contains(p.getCategory()))
                .sorted(Comparator.comparingDouble(Product::getAverageRating).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public void evictCache(String userId) {
        redisTemplate.delete(CACHE_PREFIX + userId);
        log.debug("Evicted recommendation cache for user {}", userId);
    }
}
