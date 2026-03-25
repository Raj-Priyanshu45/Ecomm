package com.ecommerce.second.service;

import com.ecommerce.second.dto.requestDTO.CreateReviewRequest;
import com.ecommerce.second.dto.responseDTO.ReviewResponse;
import com.ecommerce.second.exceptionHandling.AccessDeniedException;
import com.ecommerce.second.exceptionHandling.ProductNotFoundException;
import com.ecommerce.second.exceptionHandling.UserNotFoundException;
import com.ecommerce.second.model.Products;
import com.ecommerce.second.model.Review;
import com.ecommerce.second.model.User;
import com.ecommerce.second.repo.OrderItemRepo;
import com.ecommerce.second.repo.ProductRepo;
import com.ecommerce.second.repo.ReviewRepo;
import com.ecommerce.second.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final ReviewRepo reviewRepo;
    private final ProductRepo productRepo;
    private final UserRepo userRepo;
    private final OrderItemRepo orderItemRepo;

    // ─────────────────────────────────────────────────────────────
    // Submit a review
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ReviewResponse submitReview(int productId, CreateReviewRequest req, Authentication auth) {
        String keycloakId = auth.getName();

        User user = userRepo.findByKeyCloakId(keycloakId)
                .orElseThrow(() -> new UserNotFoundException("User not found — call /api/auth/register first"));

        Products product = productRepo.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + productId));

        // Guard: customer must have a delivered order containing this product
        boolean hasPurchased = orderItemRepo.findBySellerKeycloakId(keycloakId).stream()
                .anyMatch(oi -> oi.getProduct().getId() == productId);
        // Note: we check order items; in a stricter version filter by DELIVERED status too
        if (!hasPurchased) {
            throw new AccessDeniedException("You can only review products you have purchased");
        }

        // Guard: one review per product per user
        if (reviewRepo.existsByProductIdAndUserId(productId, user.getId())) {
            throw new IllegalArgumentException("You have already reviewed this product");
        }

        Review review = reviewRepo.save(Review.builder()
                .rating(req.getRating())
                .comment(req.getComment())
                .product(product)
                .user(user)
                .build());

        log.info("Review submitted: productId={}, userId={}, rating={}", productId, user.getId(), req.getRating());

        // Update aggregate rating async so the response returns immediately
        updateProductRatingAsync(productId);

        return toResponse(review);
    }

    // ─────────────────────────────────────────────────────────────
    // Get reviews for a product (public)
    // ─────────────────────────────────────────────────────────────

    public Page<ReviewResponse> getReviews(int productId, int page, int size) {
        if (!productRepo.existsById(productId)) {
            throw new ProductNotFoundException("Product not found: " + productId);
        }
        return reviewRepo.findByProductIdOrderByIdDesc(
                productId, PageRequest.of(page, size, Sort.by("id").descending()))
                .map(this::toResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // Delete own review (or admin)
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public void deleteReview(int productId, Long reviewId, Authentication auth) {
        String keycloakId = auth.getName();

        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        if (review.getProduct().getId() != productId) {
            throw new IllegalArgumentException("Review does not belong to this product");
        }

        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !review.getUser().getKeyCloakId().equals(keycloakId)) {
            throw new AccessDeniedException("You can only delete your own reviews");
        }

        reviewRepo.delete(review);
        log.info("Review deleted: reviewId={}, productId={}", reviewId, productId);

        updateProductRatingAsync(productId);
    }

    // ─────────────────────────────────────────────────────────────
    // Edit own review
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ReviewResponse editReview(int productId, Long reviewId,
            CreateReviewRequest req, Authentication auth) {
        String keycloakId = auth.getName();

        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        if (review.getProduct().getId() != productId) {
            throw new IllegalArgumentException("Review does not belong to this product");
        }
        if (!review.getUser().getKeyCloakId().equals(keycloakId)) {
            throw new AccessDeniedException("You can only edit your own reviews");
        }

        review.setRating(req.getRating());
        review.setComment(req.getComment());
        reviewRepo.save(review);

        log.info("Review edited: reviewId={}", reviewId);
        updateProductRatingAsync(productId);

        return toResponse(review);
    }

    // ─────────────────────────────────────────────────────────────
    // Async: recalculate product aggregate rating
    // Runs on the virtual-thread executor — does not block the HTTP response
    // ─────────────────────────────────────────────────────────────

    @Async("threadExecutor")
    @Transactional
    public void updateProductRatingAsync(int productId) {
        productRepo.findById(productId).ifPresent(product -> {
            var reviews = reviewRepo.findByProductIdOrderByIdDesc(
                    productId, PageRequest.of(0, Integer.MAX_VALUE)).getContent();

            int count = reviews.size();
            int sum   = reviews.stream().mapToInt(Review::getRating).sum();
            double avg = count > 0 ? (double) sum / count : 0.0;

            product.setReviewCount(count);
            product.setRatingSum(sum);
            product.setRatingAverage(Math.round(avg * 10.0) / 10.0);
            productRepo.save(product);

            log.debug("Rating updated: productId={}, count={}, avg={}", productId, count, avg);
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Mapping
    // ─────────────────────────────────────────────────────────────

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getRating(),
                r.getComment(),
                r.getUser().getKeyCloakId()
        );
    }
}