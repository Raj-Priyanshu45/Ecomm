package com.ecommerce.second.controller;

import com.ecommerce.second.dto.responseDTO.AllProductResponse;
import com.ecommerce.second.dto.responseDTO.ApiResponse;
import com.ecommerce.second.dto.responseDTO.SingleProductResponse;
import com.ecommerce.second.dto.responseDTO.VariantResponse;
import com.ecommerce.second.service.ProductBrowseService;
import com.ecommerce.second.service.VariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * PUBLIC PRODUCT BROWSE ENDPOINTS  (no authentication required)
 * ──────────────────────────────────────────────────────────────────────────────
 *  GET  /api/browse/products                          — paginated product list
 *  GET  /api/browse/products/{productId}              — single product detail
 *  GET  /api/browse/products/tag/{slug}               — filter by tag slug
 *  GET  /api/browse/products/search?q=               — keyword search by name
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/browse/products")
public class ProductBrowseController {

    private final ProductBrowseService productBrowseService;
    private final VariantService variantService;

    /**
     * GET /api/browse/products?page=0&size=20&sortBy=updatedAt&direction=desc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AllProductResponse>> listProducts(
            @RequestParam(defaultValue = "0")          int page,
            @RequestParam(defaultValue = "20")         int size,
            @RequestParam(defaultValue = "updatedAt")  String sortBy,
            @RequestParam(defaultValue = "desc")       String direction) {
        return ResponseEntity.ok(productBrowseService.listProducts(page, size, sortBy, direction));
    }

    /**
     * GET /api/browse/products/{productId}
     */
    @GetMapping("/{productId}")
    public ResponseEntity<SingleProductResponse> getProductDetail(@PathVariable int productId) {
        return ResponseEntity.ok(productBrowseService.getProductDetail(productId));
    }

    /**
     * GET /api/browse/products/{productId}/variants
     */
    @GetMapping("/{productId}/variants")
    public ResponseEntity<java.util.List<VariantResponse>> getVariants(@PathVariable int productId) {
        return ResponseEntity.ok(variantService.getVariants(productId));
    }

    /**
     * GET /api/browse/products/tag/{slug}?page=0&size=20
     */
    @GetMapping("/tag/{slug}")
    public ResponseEntity<ApiResponse<AllProductResponse>> listByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productBrowseService.listByTag(slug, page, size));
    }

    /**
     * GET /api/browse/products/search?q=iphone&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<AllProductResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productBrowseService.search(q, page, size));
    }
}