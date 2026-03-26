import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ReviewService } from '../../services/review.service';
import {
  SingleProductResponse,
  ReviewResponse,
  CreateReviewRequest,
} from '../../models/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { NgClass, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule, StarRatingComponent, NgClass, CurrencyPipe],
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

  // Image viewer
  selectedImage = '';

  // Variant selection
  selectedVariantKey = '';
  selectedVariantValue = '';

  // Cart
  quantity = 1;
  cartMessage = '';

  // Reviews
  reviews: ReviewResponse[] = [];
  reviewPage = 0;
  totalReviewPages = 0;
  newRating = 5;
  newComment = '';
  reviewError = '';
  reviewSuccess = '';

  imageBase = 'http://localhost:8080';

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.oidc.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
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
      next: (res: any) => {
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
        next: () => (this.cartMessage = 'Added to cart!'),
        error: () => (this.cartMessage = 'Failed to add to cart.'),
      });
    setTimeout(() => (this.cartMessage = ''), 3000);
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
      },
      error: (err) => {
        this.reviewError = err.error?.mess?.[0] ?? 'Could not submit review.';
      },
    });
  }
}