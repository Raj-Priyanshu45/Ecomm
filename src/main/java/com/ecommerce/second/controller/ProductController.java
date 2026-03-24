package com.ecommerce.second.controller;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ecommerce.second.dto.requestDTO.CreateProducts;
import com.ecommerce.second.dto.requestDTO.ModifyProducts;
import com.ecommerce.second.dto.requestDTO.SwapPrimaryImageRequest;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT ENDPOINTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Product CRUD
 * ┌──────────┬──────────────────────────────────┬────────────────────────────┐
 * │ Method   │ URL                              │ Description                │
 * ├──────────┼──────────────────────────────────┼────────────────────────────┤
 * │ POST     │ /api/products                    │ Create a product           │
 * │ PUT      │ /api/products/{productId}        │ Update product details     │
 * │ DELETE   │ /api/products/{productId}        │ Delete a product           │
 * └──────────┴──────────────────────────────────┴────────────────────────────┘
 *
 * Product Image Management
 * ┌──────────┬──────────────────────────────────────────────────┬────────────────────────────────────────┐
 * │ Method   │ URL                                              │ Description                            │
 * ├──────────┼──────────────────────────────────────────────────┼────────────────────────────────────────┤
 * │ POST     │ /api/products/{productId}/images                 │ Upload images                          │
 * │ GET      │ /api/products/{productId}/images                 │ List all images                        │
 * │ PUT      │ /api/products/{productId}/images/{imageId}       │ Replace an image file                  │
 * │ DELETE   │ /api/products/{productId}/images/{imageId}       │ Delete one image                       │
 * │ DELETE   │ /api/products/{productId}/images                 │ Delete all images                      │
 * │ PUT      │ /api/products/{productId}/images/primary         │ Swap primary image                     │
 * └──────────┴──────────────────────────────────────────────────┴────────────────────────────────────────┘
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    // ─────────────────────────────────────────────────────────────
    // Product CRUD
    // ─────────────────────────────────────────────────────────────

    /**
     * POST /api/products
     * Body: { name, price, description, tags[] }
     */
    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> addProduct(
            @RequestBody @Valid CreateProducts request,
            Authentication authentication) {

        return ResponseEntity.status(201).body(productService.saveProduct(request, authentication));
    }

    /**
     * PUT /api/products/{productId}
     * Body: { name, price, description, tags[] }
     */
    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> modifyProduct(
            @PathVariable int productId,
            @RequestBody @Valid ModifyProducts request,
            Authentication authentication) {

        return ResponseEntity.ok(productService.modifyProduct(productId, request, authentication));
    }

    /**
     * DELETE /api/products/{productId}
     */
    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN') or hasRole('SUPPORT')")
    public ResponseEntity<?> deleteProduct(
            @PathVariable int productId,
            Authentication authentication) {

        String name = productService.deleteProduct(productId, authentication);
        return ResponseEntity.ok(new Response("Product '" + name + "' deleted successfully"));
    }

    // ─────────────────────────────────────────────────────────────
    // Product Image Management
    // ─────────────────────────────────────────────────────────────

    /**
     * POST /api/products/{productId}/images
     * Form-data: images (files), primaryKey (int, 0-based index)
     */
    @PostMapping("/{productId}/images")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadImages(
            @PathVariable int productId,
            @RequestParam("images") MultipartFile[] files,
            @RequestParam int primaryKey,
            Authentication authentication) throws IOException {

        if (primaryKey < 0 || primaryKey >= files.length) {
            return ResponseEntity.badRequest().body(new Response("primaryKey must be between 0 and " + (files.length - 1)));
        }

        var urls = productService.uploadImages(productId, primaryKey, files, authentication);
        return ResponseEntity.status(201).body(urls);
    }

    /**
     * GET /api/products/{productId}/images
     * Returns list of all images + primary image info.
     */
    @GetMapping("/{productId}/images")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> getImages(
            @PathVariable int productId,
            Authentication authentication) {

        return ResponseEntity.ok(productService.getImagesInfo(productId, authentication));
    }

    /**
     * PUT /api/products/{productId}/images/{imageId}
     * Replace an image file on disk. DB record (ID, primaryImage) stays the same.
     * Form-data: image (single file)
     */
    @PutMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> modifyImage(
            @PathVariable int productId,
            @PathVariable int imageId,
            @RequestParam("image") MultipartFile newFile,
            Authentication authentication) throws IOException {

        String newUrl = productService.modifyImage(productId, imageId, newFile, authentication);
        return ResponseEntity.ok(new Response("Image updated. New URL: " + newUrl));
    }

    /**
     * DELETE /api/products/{productId}/images/{imageId}
     * Delete a single image by ID.
     */
    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(
            @PathVariable int productId,
            @PathVariable int imageId,
            Authentication authentication) throws IOException {

        productService.deleteImage(productId, imageId, authentication);
        return ResponseEntity.ok(new Response("Image deleted successfully"));
    }

    /**
     * DELETE /api/products/{productId}/images
     * Delete all images for a product.
     */
    @DeleteMapping("/{productId}/images")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllImages(
            @PathVariable int productId,
            Authentication authentication) throws IOException {

        productService.deleteAllImages(productId, authentication);
        return ResponseEntity.ok(new Response("All images deleted successfully"));
    }

    /**
     * PUT /api/products/{productId}/images/primary
     * Swap the primary image.
     * Body: { oldImageId, newImageId }
     */
    @PutMapping("/{productId}/images/primary")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> updatePrimaryImage(
            @PathVariable int productId,
            @RequestBody @Valid SwapPrimaryImageRequest request,
            Authentication authentication) {

        productService.updatePrimaryImage(productId, request.getOldImageId(), request.getNewImageId(), authentication);
        return ResponseEntity.ok(new Response("Primary image updated successfully"));
    }
}
