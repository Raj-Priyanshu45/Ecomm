import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderResponse, PlaceOrderRequest, PageResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  placeOrder(req: PlaceOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, req);
  }

  getMyOrders(page = 0, size = 10): Observable<PageResponse<OrderResponse>> {
    return this.http.get<PageResponse<OrderResponse>>(
      `${this.baseUrl}?page=${page}&size=${size}`
    );
  }

  getOrderDetail(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${orderId}`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, {});
  }

  requestReturn(orderId: number): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.baseUrl}/${orderId}/return`, {});
  }
}