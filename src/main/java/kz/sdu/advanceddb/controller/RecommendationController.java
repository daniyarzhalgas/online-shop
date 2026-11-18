package kz.sdu.advanceddb.controller;

import kz.sdu.advanceddb.dto.RecommendationItem;
import kz.sdu.advanceddb.model.User;
import kz.sdu.advanceddb.service.RecommendationService;
import kz.sdu.advanceddb.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<RecommendationItem>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getId(), limit));
    }

    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<RecommendationItem>> getSimilar(
            @PathVariable String productId,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getSimilarProducts(productId, limit));
    }
}
