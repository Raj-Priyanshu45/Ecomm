import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateReviewRequest, ReviewResponse } from '../models/models';

export interface PagedReviews {
  content: ReviewResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  getReviews(productId: number, page = 0, size = 10): Observable<PagedReviews> {
    return this.http.get<PagedReviews>(
      `${this.baseUrl}/api/browse/products/${productId}/reviews?page=${page}&size=${size}`
    );
  }

  submitReview(productId: number, req: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(
      `${this.baseUrl}/api/products/${productId}/reviews`,
      req
    );
  }

  editReview(
    productId: number,
    reviewId: number,
    req: CreateReviewRequest
  ): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(
      `${this.baseUrl}/api/products/${productId}/reviews/${reviewId}`,
      req
    );
  }

  deleteReview(productId: number, reviewId: number): Observable<unknown> {
    return this.http.delete(
      `${this.baseUrl}/api/products/${productId}/reviews/${reviewId}`
    );
  }
}