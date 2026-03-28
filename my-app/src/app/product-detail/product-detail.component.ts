import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe, NgClass } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ProductService } from '../services/product.service';
import { CartService } from '../features/cart/cart.service';
import { ReviewService } from '../services/review.service';
import { SingleProductResponse, ReviewResponse, CreateReviewRequest } from '../models/models';
import { StarRatingComponent } from '../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule, StarRatingComponent, NgClass, KeyValuePipe, RouterModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private oidc = inject(OidcSecurityService);

  product: SingleProductResponse | null = null;
  productId!: number;
  loading = true;
  isAuthenticated = false;
  currentUserId: string | null = null;

  selectedImage = '';

  selectedVariantKey = '';
  selectedVariantValue = '';

  quantity = 1;
  cartMessage = '';

  reviews: ReviewResponse[] = [];
  reviewPage = 0;
  totalReviewPages = 0;
  newRating = 5;
  newComment = '';
  reviewError = '';
  reviewSuccess = '';

  // Review Edit State
  editingReviewId: number | null = null;
  editRating = 5;
  editComment = '';
  editError = '';

  imageBase = 'http://localhost:8080';

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.oidc.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        this.oidc.getUserData().subscribe(userData => {
           // Keycloak uses 'sub' for the user ID
           this.currentUserId = userData?.sub || null;
        });
      }
    });
    this.loadProduct();
    this.loadReviews();
  }

  loadProduct(): void {
    this.productService.getProductDetail(this.productId).subscribe({
      next: (p) => {
        this.product = p;
        this.selectedImage = p.imageUrl?.[0] ?? '';
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadReviews(): void {
    this.reviewService.getReviews(this.productId, this.reviewPage).subscribe({
      next: (res) => {
        this.reviews = res.content ?? [];
        this.totalReviewPages = res.totalPages ?? 0;
      },
    });
  }

  selectVariant(key: string, value: string): void {
    this.selectedVariantKey = key;
    this.selectedVariantValue = value;
  }

  isVariantSelected(key: string, value: string): boolean {
    return this.selectedVariantKey === key && this.selectedVariantValue === value;
  }

  addToCart(): void {
    if (!this.isAuthenticated) {
      this.oidc.authorize();
      return;
    }
    this.cartService
      .addItem({ productId: this.productId, quantity: this.quantity })
      .subscribe({
        next: () => (this.cartMessage = 'Item added to your cart successfully!'),
        error: () => (this.cartMessage = 'Failed to add to cart.'),
      });
    setTimeout(() => (this.cartMessage = ''), 5000);
  }

  get isOutOfStock(): boolean {
    return this.product ? this.product.count < 1 : true;
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  submitReview(): void {
    this.reviewError = '';
    this.reviewSuccess = '';
    const req: CreateReviewRequest = {
      rating: this.newRating,
      comment: this.newComment,
    };
    this.reviewService.submitReview(this.productId, req).subscribe({
      next: () => {
        this.reviewSuccess = 'Review submitted!';
        this.newComment = '';
        this.newRating = 5;
        this.loadReviews();
        setTimeout(() => (this.reviewSuccess = ''), 3000);
      },
      error: (err: any) => {
        this.reviewError = err.error?.mess?.[0] || err.error?.message || 'Could not submit review.';
      },
    });
  }

  startEditReview(r: ReviewResponse): void {
    this.editingReviewId = r.reviewId;
    this.editRating = r.rating;
    this.editComment = r.comment || '';
    this.editError = '';
  }

  cancelEditReview(): void {
    this.editingReviewId = null;
  }

  updateReview(): void {
    if (!this.editingReviewId) return;
    this.editError = '';
    const req: CreateReviewRequest = {
      rating: this.editRating,
      comment: this.editComment,
    };
    this.reviewService.editReview(this.productId, this.editingReviewId, req).subscribe({
      next: () => {
        this.editingReviewId = null;
        this.loadReviews();
      },
      error: (err: any) => {
        this.editError = err.error?.mess?.[0] || err.error?.message || 'Failed to update review.';
      }
    });
  }

  deleteReview(reviewId: number): void {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.reviewService.deleteReview(this.productId, reviewId).subscribe({
      next: () => this.loadReviews(),
      error: () => alert('Failed to delete review')
    });
  }
}