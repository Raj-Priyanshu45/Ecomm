import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { OrderResponse } from '../../models/models';

interface PagedOrders {
  content: OrderResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe],
  templateUrl: './my-orders.component.html',
})
export class MyOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  orders: OrderResponse[] = [];
  loading = true;
  page = 0;
  totalPages = 0;
  expandedOrderId: number | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.http
      .get<PagedOrders>(`${this.baseUrl}/api/orders?page=${this.page}&size=10`)
      .subscribe({
        next: (res) => {
          this.orders = res.content;
          this.totalPages = res.totalPages;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  toggleOrder(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  cancelOrder(orderId: number): void {
    this.http
      .put(`${this.baseUrl}/api/orders/${orderId}/cancel`, {})
      .subscribe({
        next: () => this.loadOrders(),
      });
  }

  requestReturn(orderId: number): void {
    this.http
      .put(`${this.baseUrl}/api/orders/${orderId}/return`, {})
      .subscribe({
        next: () => this.loadOrders(),
      });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PACKED: 'bg-indigo-100 text-indigo-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      ARRIVED: 'bg-green-100 text-green-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      RETURN_REQUESTED: 'bg-pink-100 text-pink-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}