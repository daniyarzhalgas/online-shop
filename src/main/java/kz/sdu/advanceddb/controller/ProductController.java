package kz.sdu.advanceddb.controller;

import jakarta.validation.Valid;
import kz.sdu.advanceddb.dto.PopularProductDto;
import kz.sdu.advanceddb.dto.ProductRequest;
import kz.sdu.advanceddb.model.Product;
import kz.sdu.advanceddb.service.AnalyticsService;
import kz.sdu.advanceddb.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AnalyticsService analyticsService;

    @GetMapping("/popular")
    public ResponseEntity<List<PopularProductDto>> getPopular(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getPopularProducts(limit));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAll(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(productService.getAll(category));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> search(
            @RequestParam String q,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(productService.search(q, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getOne(@PathVariable String id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> update(@PathVariable String id,
                                          @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
