import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  orderItemId: number;
  productName: string;
  quantity: number;
  lineTotal: number;
  skuCode: string;
}

interface AdminOrder {
  orderId: number;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  warehouseName: string;
  items: OrderItem[];
  placedAt: string;
  paymentConfirmed: boolean;
}

const ORDER_STATUSES = [
  'PLACED', 'PAYMENT_CONFIRMED', 'CONFIRMED', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED',
  'CANCELLED', 'RETURN_REQUESTED', 'RETURN_PICKED_UP', 'REFUNDED', 'DELIVERY_FAILED'
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20">
      <div class="max-w-6xl mx-auto px-4 py-8">

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-black text-gray-900">Order Management</h1>
            <p class="text-gray-500 text-sm mt-1">{{ totalElements }} total orders in the system</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <a routerLink="/admin/vendors"
               class="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600
                      hover:bg-gray-50 transition-colors">
              Vendors →
            </a>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-2">
          <button (click)="selectedStatus = ''; loadOrders()"
                  [class]="!selectedStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors">
            All
          </button>
          @for (s of statusFilters; track s.value) {
            <button (click)="selectedStatus = s.value; loadOrders()"
                    [class]="selectedStatus === s.value ? s.activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                    class="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors">
              {{ s.label }}
            </button>
          }
        </div>

        <!-- Orders Table -->
        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
            }
          </div>
        } @else if (orders.length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-lg font-medium">No orders found</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (order of orders; track order.orderId) {
              <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden
                          hover:shadow-md transition-all duration-200">
                <div class="p-5 flex items-start justify-between gap-4 cursor-pointer"
                     (click)="toggle(order.orderId)">
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-black text-indigo-600">#{{ order.orderId }}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-bold text-gray-900 text-sm">{{ order.shippingName }}</p>
                        <span [class]="getStatusClass(order.status)"
                              class="text-xs px-2 py-0.5 rounded-full font-medium">
                          {{ order.status.replace('_', ' ') }}
                        </span>
                        @if (!order.paymentConfirmed) {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                            Unpaid
                          </span>
                        }
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {{ order.shippingCity }}, {{ order.shippingState }}
                        @if (order.warehouseName) {
                          · {{ order.warehouseName }}
                        }
                        · {{ order.placedAt | date:'mediumDate' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="font-bold text-gray-900">₹{{ order.totalAmount | number:'1.0-0' }}</span>
                    <svg [class]="expandedId === order.orderId ? 'rotate-180' : ''"
                         class="w-4 h-4 text-gray-400 transition-transform"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>

                @if (expandedId === order.orderId) {
                  <div class="border-t border-gray-50 p-5 space-y-4 bg-gray-50/30">
                    <!-- Items -->
                    <div class="space-y-1.5">
                      @for (item of order.items; track item.orderItemId) {
                        <div class="flex justify-between text-sm text-gray-600">
                          <span>{{ item.productName }}
                            @if (item.skuCode) {
                              <span class="text-xs text-gray-400 ml-1">({{ item.skuCode }})</span>
                            }
                            × {{ item.quantity }}
                          </span>
                          <span class="font-medium">₹{{ item.lineTotal | number:'1.0-0' }}</span>
                        </div>
                      }
                    </div>

                    <!-- Status Update -->
                    <div class="flex items-center gap-3 pt-2">
                      <select [(ngModel)]="statusUpdates[order.orderId]"
                              class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                                     focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                        <option value="">Change status…</option>
                        @for (s of availableStatuses; track s) {
                          <option [value]="s">{{ s.replace('_', ' ') }}</option>
                        }
                      </select>
                      <button (click)="updateStatus(order.orderId)"
                              [disabled]="!statusUpdates[order.orderId] || updatingId === order.orderId"
                              class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl
                                     font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40">
                        {{ updatingId === order.orderId ? '…' : 'Update' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages > 1) {
            <div class="flex items-center justify-center gap-2 mt-8">
              <button (click)="goToPage(page - 1)" [disabled]="page === 0"
                      class="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <span class="text-sm text-gray-500">{{ page + 1 }} / {{ totalPages }}</span>
              <button (click)="goToPage(page + 1)" [disabled]="page >= totalPages - 1"
                      class="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  orders: AdminOrder[] = [];
  loading = true;
  selectedStatus = '';
  expandedId: number | null = null;
  page = 0;
  totalPages = 0;
  totalElements = 0;
  statusUpdates: Record<number, string> = {};
  updatingId: number | null = null;
  availableStatuses = ORDER_STATUSES;

  statusFilters = [
    { value: 'PLACED', label: 'Placed', activeClass: 'bg-yellow-500 text-white' },
    { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', activeClass: 'bg-blue-500 text-white' },
    { value: 'CONFIRMED', label: 'Confirmed', activeClass: 'bg-indigo-500 text-white' },
    { value: 'PACKED', label: 'Packed', activeClass: 'bg-purple-500 text-white' },
    { value: 'SHIPPED', label: 'Shipped', activeClass: 'bg-cyan-500 text-white' },
    { value: 'DELIVERED', label: 'Delivered', activeClass: 'bg-green-500 text-white' },
    { value: 'CANCELLED', label: 'Cancelled', activeClass: 'bg-red-500 text-white' },
    { value: 'RETURN_REQUESTED', label: 'Returns', activeClass: 'bg-orange-500 text-white' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    const statusParam = this.selectedStatus ? `&status=${this.selectedStatus}` : '';
    this.http.get<any>(
      `${this.baseUrl}/api/admin/orders?page=${this.page}&size=15${statusParam}`
    ).subscribe({
      next: (res) => {
        this.orders = res.content ?? [];
        this.totalPages = res.totalPages ?? 0;
        this.totalElements = res.totalElements ?? 0;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  updateStatus(orderId: number): void {
    const status = this.statusUpdates[orderId];
    if (!status) return;
    this.updatingId = orderId;
    this.http.put(`${this.baseUrl}/api/admin/orders/${orderId}/status`, { status }).subscribe({
      next: () => {
        this.updatingId = null;
        delete this.statusUpdates[orderId];
        this.loadOrders();
      },
      error: () => (this.updatingId = null)
    });
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.loadOrders();
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-indigo-100 text-indigo-700',
      PACKED: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-cyan-100 text-cyan-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      ARRIVED: 'bg-teal-100 text-teal-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      RETURN_REQUESTED: 'bg-pink-100 text-pink-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
      DELIVERY_FAILED: 'bg-red-100 text-red-600',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}