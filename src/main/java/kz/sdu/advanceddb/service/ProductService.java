package kz.sdu.advanceddb.service;

import tools.jackson.databind.ObjectMapper;
import kz.sdu.advanceddb.dto.ProductRequest;
import kz.sdu.advanceddb.model.Product;
import kz.sdu.advanceddb.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public List<Product> getAll(String category) {
        if (category != null && !category.isBlank()) {
            return productRepository.findByCategoryIgnoreCase(category);
        }
        return productRepository.findAll();
    }

    public Product getById(String id) {
        String cacheKey = "product:" + id;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, Product.class);
            } catch (Exception e) {
                log.warn("Cache deserialization failed for key {}", cacheKey);
            }
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(product), Duration.ofMinutes(10));
        } catch (Exception e) {
            log.warn("Failed to cache product {}", id);
        }

        return product;
    }

    public Product create(ProductRequest req) {
        Product product = Product.builder()
                .name(req.getName())
                .description(req.getDescription())
                .category(req.getCategory())
                .price(req.getPrice())
                .stock(req.getStock())
                .brand(req.getBrand())
                .tags(req.getTags())
                .build();
        return productRepository.save(product);
    }

    public Product update(String id, ProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setCategory(req.getCategory());
        product.setPrice(req.getPrice());
        product.setStock(req.getStock());
        product.setBrand(req.getBrand());
        product.setTags(req.getTags());

        Product saved = productRepository.save(product);
        redisTemplate.delete("product:" + id);
        return saved;
    }

    public void delete(String id) {
        productRepository.deleteById(id);
        redisTemplate.delete("product:" + id);
    }

    public List<Product> search(String query, String category) {
        List<Product> results = productRepository.searchByKeyword(query);
        if (category != null && !category.isBlank()) {
            results = results.stream()
                    .filter(p -> p.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }
        return results;
    }

    public void applyRating(String productId, double rating) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        int newTotal = product.getTotalRatings() + 1;
        double newAvg = ((product.getAverageRating() * product.getTotalRatings()) + rating) / newTotal;

        product.setTotalRatings(newTotal);
        product.setAverageRating(newAvg);

        productRepository.save(product);
        redisTemplate.delete("product:" + productId);
    }
}
