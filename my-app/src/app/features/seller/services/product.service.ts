import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  createProduct(req: CreateProductRequest): Observable<any> {
    return this.http.post(this.baseUrl, req);
  }
}