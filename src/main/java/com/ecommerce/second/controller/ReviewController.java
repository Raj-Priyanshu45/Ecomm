package com.ecommerce.second.controller;

import com.ecommerce.second.dto.requestDTO.CreateReviewRequest;
import com.ecommerce.second.dto.responseDTO.Response;
import com.ecommerce.second.dto.responseDTO.ReviewResponse;
import com.ecommerce.second.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * REVIEW ENDPOINTS
 * ──────────────────────────────────────────────────────────────────────────────
 *  GET    /api/browse/products/{productId}/reviews         — public, paginated
 *  POST   /api/products/{productId}/reviews                — CUSTOMER (must have purchased)
 *  PUT    /api/products/{productId}/reviews/{reviewId}     — CUSTOMER (own review)
 *  DELETE /api/products/{productId}/reviews/{reviewId}     — CUSTOMER own / ADMIN
 * ──────────────────────────────────────────────────────────────────────────────
 */
@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Public — no auth needed */
    @GetMapping("/api/browse/products/{productId}/reviews")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable int productId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviews(productId, page, size));
    }

    /** Customer submits a review — must have purchased the product */
    @PostMapping("/api/products/{productId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> submitReview(
            @PathVariable int productId,
            @RequestBody @Valid CreateReviewRequest req,
            Authentication auth) {
        return ResponseEntity.status(201).body(reviewService.submitReview(productId, req, auth));
    }

    /** Customer edits own review */
    @PutMapping("/api/products/{productId}/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> editReview(
            @PathVariable int productId,
            @PathVariable Long reviewId,
            @RequestBody @Valid CreateReviewRequest req,
            Authentication auth) {
        return ResponseEntity.ok(reviewService.editReview(productId, reviewId, req, auth));
    }

    /** Customer deletes own review; admin can delete any */
    @DeleteMapping("/api/products/{productId}/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Response> deleteReview(
            @PathVariable int productId,
            @PathVariable Long reviewId,
            Authentication auth) {
        reviewService.deleteReview(productId, reviewId, auth);
        return ResponseEntity.ok(new Response("Review deleted successfully"));
    }
}