package com.ecommerce.second.controller;


import com.ecommerce.second.service.ProductBrowseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC / CUSTOMER PRODUCT BROWSING
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GET /api/browse/products              → paginated product list
 * GET /api/browse/products/{id}         → single product detail
 * GET /api/browse/products/tag/{slug}   → products filtered by tag
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No @PreAuthorize needed — all authenticated users can browse.
 * To make fully public (no JWT), add .requestMatchers("/api/browse/**").permitAll()
 * in SecurityConfig.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/browse")
public class ProductBrowseController {

    private final ProductBrowseService browseService;

    /** GET /api/browse/products?page=0&size=20&sortBy=updatedAt&direction=desc */
    @GetMapping("/products")
    public ResponseEntity<?> listProducts(
            @RequestParam(defaultValue = "0")        int page,
            @RequestParam(defaultValue = "20")       int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc")     String direction) {

        return ResponseEntity.ok(browseService.listProducts(page, size, sortBy, direction));
    }

    /** GET /api/browse/products/{id} */
    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProduct(@PathVariable int id) {
        return ResponseEntity.ok(browseService.getProductDetail(id));
    }

    /** GET /api/browse/products/tag/{slug}?page=0&size=20 */
    @GetMapping("/products/tag/{slug}")
    public ResponseEntity<?> listByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(browseService.listByTag(slug, page, size));
    }
}