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
}