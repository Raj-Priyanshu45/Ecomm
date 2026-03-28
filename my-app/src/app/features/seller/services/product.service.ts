import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  tags: string[];
}

export interface CreateProductResponse {
  productId: number;
  name: string;
  description: string;
  sellerId: string;
  price: number;
  tags: string[];
  count: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  createProduct(req: CreateProductRequest): Observable<CreateProductResponse> {
    return this.http.post<CreateProductResponse>(this.baseUrl, req);
  }

  uploadImages(
    productId: number,
    files: File[],
    primaryKey: number
  ): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('primaryKey', primaryKey.toString());
    return this.http.post(`${this.baseUrl}/${productId}/images`, formData);
  }

  getSellerProducts(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  updateProduct(productId: number, req: CreateProductRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/${productId}`, req);
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}`);
  }

  getProductImageInfo(productId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${productId}/images`);
  }

  replaceImage(productId: number, imageId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put(`${this.baseUrl}/${productId}/images/${imageId}`, formData);
  }

  deleteImage(productId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}/images/${imageId}`);
  }

  deleteAllImages(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}/images`);
  }

  swapPrimaryImage(productId: number, oldImageId: number, newImageId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${productId}/images/primary`, {
      oldImageId,
      newImageId
    });
  }

  // ─── Variant CRUD ──────────────────────────────────────────

  addVariant(productId: number, data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${productId}/variants`, data);
  }

  updateVariantPrice(productId: number, variantId: number, newPrice: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${productId}/variants/${variantId}/price`, { newPrice });
  }

  updateVariantStock(productId: number, variantId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${productId}/variants/${variantId}/stock`, { quantity });
  }

  deleteVariant(productId: number, variantId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}/variants/${variantId}`);
  }

  // ─── Variant Image Management ──────────────────────────────

  uploadVariantImages(productId: number, variantId: number, files: File[], primaryKey: number): Observable<any> {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('primaryKey', primaryKey.toString());
    return this.http.post(`${this.baseUrl}/${productId}/variants/${variantId}/images`, fd);
  }

  replaceVariantImage(productId: number, variantId: number, imageId: number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.put(`${this.baseUrl}/${productId}/variants/${variantId}/images/${imageId}`, fd);
  }

  deleteVariantImage(productId: number, variantId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}/variants/${variantId}/images/${imageId}`);
  }

  deleteAllVariantImages(productId: number, variantId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${productId}/variants/${variantId}/images`);
  }

  swapVariantPrimaryImage(productId: number, variantId: number, oldImageId: number, newImageId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${productId}/variants/${variantId}/images/primary`, { oldImageId, newImageId });
  }
}