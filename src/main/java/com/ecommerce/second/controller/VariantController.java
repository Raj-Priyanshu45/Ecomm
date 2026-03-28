package com.ecommerce.second.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import static org.springframework.http.ResponseEntity.ok;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ecommerce.second.dto.requestDTO.SwapPrimaryImageRequest;
import com.ecommerce.second.dto.requestDTO.UpdateVariantPriceRequest;
import com.ecommerce.second.dto.requestDTO.UpdateVariantStockRequest;
import com.ecommerce.second.dto.requestDTO.VarientRequest;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.dto.responseDTO.VariantResponse;
import com.ecommerce.second.service.VariantService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * VARIANT ENDPOINTS
 *  POST   /api/products/{productId}/variants
 *  PUT    /api/products/{productId}/variants/{variantId}/price
 *  PUT    /api/products/{productId}/variants/{variantId}/stock
 *  DELETE /api/products/{productId}/variants/{variantId}
 *  POST   /api/products/{productId}/variants/{variantId}/images
 *  PUT    /api/products/{productId}/variants/{variantId}/images/{imageId}
 *  DELETE /api/products/{productId}/variants/{variantId}/images/{imageId}
 *  DELETE /api/products/{productId}/variants/{variantId}/images
 *  PUT    /api/products/{productId}/variants/{variantId}/images/primary
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products/{productId}/variants")
public class VariantController {

    private final VariantService variantService;

    // ─── Variant CRUD ────────────────────────────────────────────

    /**
     * POST /api/products/{productId}/variants
     * multipart/form-data: key, value, price, quantity, primaryKey, images[]
     */
    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> addVariant(
            @PathVariable int productId,
            @ModelAttribute @Valid VarientRequest request,   // @ModelAttribute REQUIRED for multipart binding
            @RequestParam("images") MultipartFile[] files,
            @RequestParam int primaryKey,
            Authentication authentication) throws IOException {

        if (primaryKey < 0 || primaryKey >= files.length) {
            return ResponseEntity.badRequest()
                    .body(new Response("primaryKey must be between 0 and " + (files.length - 1)));
        }
        variantService.addVariant(request, productId, authentication, files, primaryKey);
        return ResponseEntity.status(201).body(new Response("Variant added successfully"));
    }

    @PutMapping("/{variantId}/price")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateVariantPrice(
            @PathVariable int productId,
            @PathVariable int variantId,
            @RequestBody @Valid UpdateVariantPriceRequest request,
            Authentication authentication) {
        variantService.modifyVariantPrice(variantId, request.getNewPrice(), productId, authentication);
        return ResponseEntity.ok(new Response("Variant price updated successfully"));
    }

    @PutMapping("/{variantId}/stock")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateVariantStock(
            @PathVariable int productId,
            @PathVariable int variantId,
            @RequestBody @Valid UpdateVariantStockRequest request,
            Authentication authentication) {
        variantService.modifyVariantStock(variantId, request.getQuantity(), productId, authentication);
        return ResponseEntity.ok(new Response("Variant stock updated successfully"));
    }

    @DeleteMapping("/{variantId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteVariant(
            @PathVariable int productId,
            @PathVariable int variantId,
            Authentication authentication) throws IOException {
        variantService.deleteVariant(variantId, productId, authentication);
        return ResponseEntity.ok(new Response("Variant deleted successfully"));
    }

    // ─── Variant Image Management ────────────────────────────────

    @PostMapping("/{variantId}/images")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadVariantImages(
            @PathVariable int productId,
            @PathVariable int variantId,
            @RequestParam("images") MultipartFile[] files,
            @RequestParam int primaryKey,
            Authentication authentication) throws IOException {
        if (primaryKey < 0 || primaryKey >= files.length) {
            return ResponseEntity.badRequest()
                    .body(new Response("primaryKey must be between 0 and " + (files.length - 1)));
        }
        var urls = variantService.uploadVariantImages(files, primaryKey, variantId, productId, authentication);
        return ResponseEntity.status(201).body(urls);
    }

    @PutMapping("/{variantId}/images/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> modifyVariantImage(
            @PathVariable int productId,
            @PathVariable int variantId,
            @PathVariable int imageId,
            @RequestParam("image") MultipartFile newFile,
            Authentication authentication) throws IOException {
        String newUrl = variantService.modifyVariantImage(imageId, variantId, productId, newFile, authentication);
        return ResponseEntity.ok(new Response("Image updated. New URL: " + newUrl));
    }

    @DeleteMapping("/{variantId}/images/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteVariantImage(
            @PathVariable int productId,
            @PathVariable int variantId,
            @PathVariable int imageId,
            Authentication authentication) throws IOException {
        variantService.deleteVariantImage(imageId, variantId, productId, authentication);
        return ResponseEntity.ok(new Response("Image deleted successfully"));
    }

    @DeleteMapping("/{variantId}/images")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllVariantImages(
            @PathVariable int productId,
            @PathVariable int variantId,
            Authentication authentication) throws IOException {
        variantService.deleteAllVariantImages(variantId, productId, authentication);
        return ResponseEntity.ok(new Response("All variant images deleted successfully"));
    }

    @PutMapping("/{variantId}/images/primary")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> updatePrimaryVariantImage(
            @PathVariable int productId,
            @PathVariable int variantId,
            @RequestBody @Valid SwapPrimaryImageRequest request,
            Authentication authentication) {
        variantService.updatePrimaryVariantImage(
                request.getOldImageId(), request.getNewImageId(),
                variantId, productId, authentication);
        return ResponseEntity.ok(new Response("Primary image updated successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<List<VariantResponse>> getVariants(
            @PathVariable int productId,
            Authentication authentication) {
        return ok(variantService.getVariants(productId));
    }
}