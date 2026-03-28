import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AllProductResponse, ApiResponse, SingleProductResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  getProducts(page = 0, size = 20): Observable<ApiResponse<AllProductResponse>> {
    return this.http.get<ApiResponse<AllProductResponse>>(
      `${this.baseUrl}/api/browse/products?page=${page}&size=${size}`
    );
  }

  searchProducts(q: string, page = 0): Observable<ApiResponse<AllProductResponse>> {
    return this.http.get<ApiResponse<AllProductResponse>>(
      `${this.baseUrl}/api/browse/products/search?q=${encodeURIComponent(q)}&page=${page}`
    );
  }

  getProductDetail(id: number): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(
      `${this.baseUrl}/api/browse/products/${id}`
    );
  }

  getProductVariants(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/browse/products/${id}/variants`);
  }

  getProductsByTag(slug: string, page = 0): Observable<ApiResponse<AllProductResponse>> {
    return this.http.get<ApiResponse<AllProductResponse>>(
      `${this.baseUrl}/api/browse/products/tag/${slug}?page=${page}`
    );
  }
}