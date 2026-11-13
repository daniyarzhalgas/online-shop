package kz.sdu.advanceddb.controller;

import kz.sdu.advanceddb.model.Product;
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
    public ResponseEntity<List<Product>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getId(), limit));
    }
}
