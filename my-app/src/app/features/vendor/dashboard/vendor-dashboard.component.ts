import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VendorProfile {
  id: number;
  email: string;
  phone: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  adminNote: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  registeredAt: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

interface OrderItem {
  orderItemId: number;
  productName: string;
  quantity: number;
  lineTotal: number;
  skuCode: string;
}

interface Order {
  orderId: number;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  placedAt: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/20">
      <div class="max-w-6xl mx-auto px-4 py-8">

        <!-- ── Loading ── -->
        @if (loading) {
          <div class="flex items-center justify-center py-24">
            <svg class="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        }

        <!-- ── No Profile ── -->
        @else if (!profile) {
          <div class="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <p class="text-lg font-medium text-gray-600">No vendor profile found</p>
            <a routerLink="/vendor/register"
               class="mt-4 px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium
                      hover:bg-purple-700 transition-colors">
              Apply to Become a Vendor
            </a>
          </div>
        }

        <!-- ── PENDING / REJECTED State ── -->
        @else if (profile.status === 'PENDING' || profile.status === 'REJECTED') {
          <div class="max-w-lg mx-auto py-12">
            <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div class="{{ profile.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-400' }} px-6 py-5">
                <p class="{{ profile.status === 'REJECTED' ? 'text-white' : 'text-yellow-900' }} text-2xl font-black">
                  {{ profile.status === 'PENDING' ? '⏳ Application Pending' : '😔 Application Rejected' }}
                </p>
                <p class="{{ profile.status === 'REJECTED' ? 'text-red-100' : 'text-yellow-800' }} text-sm mt-1">
                  {{ profile.status === 'PENDING'
                     ? 'Our team is reviewing your application. Please check back later.'
                     : 'Your application was not approved at this time.' }}
                </p>
              </div>
              <div class="p-6 space-y-3">
                @if (profile.adminNote) {
                  <div class="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                    <p class="font-semibold">Admin Note</p>
                    <p class="mt-0.5">{{ profile.adminNote }}</p>
                  </div>
                }
                <div class="text-sm text-gray-500">
                  Applied on {{ profile.registeredAt | date:'mediumDate' }}
                </div>
                <a routerLink="/"
                   class="block text-center py-3 border border-gray-200 rounded-xl text-gray-600
                          hover:bg-gray-50 transition-colors text-sm font-medium">
                  Back to Shop
                </a>
              </div>
            </div>
          </div>
        }

        <!-- ── APPROVED Dashboard ── -->
        @else {
          <!-- Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 class="text-3xl font-black text-gray-900">Vendor Dashboard</h1>
              <p class="text-gray-500 text-sm mt-1">{{ profile.email }}</p>
            </div>
            <div class="flex gap-2">
              @if (unreadCount > 0) {
                <button (click)="markAllRead()"
                        class="relative text-sm px-4 py-2 bg-purple-600 text-white rounded-xl
                               font-medium hover:bg-purple-700 transition-colors">
                  <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px]
                               font-black rounded-full w-5 h-5 flex items-center justify-center">
                    {{ unreadCount }}
                  </span>
                  Mark All Read
                </button>
              }
            </div>
          </div>

          <!-- Stats Row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Status</p>
              <p class="text-lg font-black text-green-600 mt-1">✓ APPROVED</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Warehouse</p>
              <p class="text-sm font-bold text-gray-900 mt-1 truncate">{{ profile.warehouseName || '—' }}</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Orders</p>
              <p class="text-2xl font-black text-gray-900 mt-1">{{ orders.length }}</p>
            </div>
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Unread Alerts</p>
              <p class="text-2xl font-black {{ unreadCount > 0 ? 'text-red-500' : 'text-gray-900' }} mt-1">
                {{ unreadCount }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- ── Notifications (left col) ── -->
            <div class="lg:col-span-1">
              <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🔔 Notifications
                @if (unreadCount > 0) {
                  <span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {{ unreadCount }} new
                  </span>
                }
              </h2>

              @if (notifications.length === 0) {
                <div class="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
                  <p class="text-sm">No notifications yet</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (n of notifications; track n.id) {
                    <div [class]="n.read
                           ? 'bg-white border-gray-100'
                           : 'bg-purple-50 border-purple-200'"
                         class="border rounded-2xl p-4">
                      <div class="flex items-start justify-between gap-2 mb-1">
                        <p class="font-semibold text-gray-900 text-sm">{{ n.title }}</p>
                        @if (!n.read) {
                          <span class="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        }
                      </div>
                      <p class="text-xs text-gray-600">{{ n.message }}</p>
                      <p class="text-xs text-gray-400 mt-2">{{ n.createdAt | date:'mediumDate' }}</p>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- ── Orders (right col) ── -->
            <div class="lg:col-span-2">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-900">📦 Warehouse Orders</h2>
                <div class="flex gap-2">
                  @for (s of orderStatusFilters; track s) {
                    <button (click)="filterStatus = s; loadOrders()"
                            [class]="filterStatus === s
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600'"
                            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      {{ s || 'All' }}
                    </button>
                  }
                </div>
              </div>

              @if (ordersLoading) {
                <div class="space-y-3">
                  @for (i of [1,2,3]; track i) {
                    <div class="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
                  }
                </div>
              } @else if (orders.length === 0) {
                <div class="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
                  <p class="text-4xl mb-3">📭</p>
                  <p class="text-sm font-medium">No orders yet</p>
                  <p class="text-xs mt-1">Orders assigned to your warehouse will appear here</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (order of orders; track order.orderId) {
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden
                                hover:shadow-md transition-all">
                      <div class="p-4 flex items-center justify-between cursor-pointer"
                           (click)="toggle(order.orderId)">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center
                                      justify-center text-xs font-black text-purple-600">
                            #{{ order.orderId }}
                          </div>
                          <div>
                            <p class="font-semibold text-gray-900 text-sm">{{ order.shippingName }}</p>
                            <p class="text-xs text-gray-400">{{ order.shippingCity }}, {{ order.shippingState }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <span [class]="statusClass(order.status)"
                                class="text-xs px-2.5 py-1 rounded-full font-medium">
                            {{ order.status.replace('_', ' ') }}
                          </span>
                          <span class="font-bold text-gray-900 text-sm">
                            ₹{{ order.totalAmount | number:'1.0-0' }}
                          </span>
                          <svg [class]="expandedId === order.orderId ? 'rotate-180' : ''"
                               class="w-4 h-4 text-gray-400 transition-transform"
                               fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  stroke-width="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>
                      </div>

                      @if (expandedId === order.orderId) {
                        <div class="border-t border-gray-50 px-4 pb-4 pt-3 bg-gray-50/50 space-y-3">
                          <div class="space-y-1">
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

                          <!-- Vendor status update (PAYMENT_CONFIRMED → CONFIRMED → PACKED → SHIPPED) -->
                          @if (canUpdateStatus(order.status)) {
                            <div class="flex items-center gap-2 pt-1">
                              <select [(ngModel)]="statusUpdates[order.orderId]"
                                      class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                                             focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                                <option value="">Update status…</option>
                                @for (s of nextStatuses(order.status); track s) {
                                  <option [value]="s">{{ s.replace('_', ' ') }}</option>
                                }
                              </select>
                              <button (click)="updateStatus(order.orderId)"
                                      [disabled]="!statusUpdates[order.orderId] || updatingId === order.orderId"
                                      class="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl
                                             font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors">
                                {{ updatingId === order.orderId ? '…' : 'Update' }}
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080';

  private pollingInterval: any;

  loading = true;
  ordersLoading = false;
  profile: VendorProfile | null = null;
  notifications: Notification[] = [];
  orders: Order[] = [];
  unreadCount = 0;
  expandedId: number | null = null;
  filterStatus = '';
  statusUpdates: Record<number, string> = {};
  updatingId: number | null = null;

  orderStatusFilters = ['', 'PAYMENT_CONFIRMED', 'CONFIRMED', 'PACKED', 'SHIPPED'];

  ngOnInit(): void {
    this.http.get<VendorProfile>(`${this.base}/api/vendor/me`).subscribe({
      next: (p) => {
        this.profile = p;
        this.loading = false;
        if (p.status === 'APPROVED' && p.warehouseId) {
          this.loadNotifications();
          this.loadOrders();
          this.startPolling();
        }
      },
      error: () => {
        this.profile = null;
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  startPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000); // Check every 30s
  }

  loadNotifications(): void {
    this.http
      .get<any>(`${this.base}/api/vendor/notifications?page=0&size=20`)
      .subscribe({
        next: (res) => {
          this.notifications = res.content ?? [];
          this.unreadCount = this.notifications.filter((n) => !n.read).length;
        },
        error: () => {},
      });
  }

  loadOrders(): void {
    if (!this.profile?.warehouseId) return;
    this.ordersLoading = true;
    const statusParam = this.filterStatus ? `&status=${this.filterStatus}` : '';
    this.http
      .get<any>(
        `${this.base}/api/vendor/orders?warehouseId=${this.profile.warehouseId}&page=0&size=30${statusParam}`
      )
      .subscribe({
        next: (res) => {
          this.orders = res.content ?? [];
          this.ordersLoading = false;
        },
        error: () => (this.ordersLoading = false),
      });
  }

  markAllRead(): void {
    this.http.put(`${this.base}/api/vendor/notifications/read`, {}).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
        this.unreadCount = 0;
      },
    });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  canUpdateStatus(status: string): boolean {
    return ['PAYMENT_CONFIRMED', 'CONFIRMED', 'PACKED'].includes(status);
  }

  nextStatuses(current: string): string[] {
    const map: Record<string, string[]> = {
      PAYMENT_CONFIRMED: ['CONFIRMED'],
      CONFIRMED: ['PACKED'],
      PACKED: ['SHIPPED'],
    };
    return map[current] ?? [];
  }

  updateStatus(orderId: number): void {
    const status = this.statusUpdates[orderId];
    if (!status) return;
    this.updatingId = orderId;
    this.http
      .put(`${this.base}/api/vendor/orders/${orderId}/status`, { status })
      .subscribe({
        next: () => {
          this.updatingId = null;
          delete this.statusUpdates[orderId];
          this.loadOrders();
        },
        error: () => (this.updatingId = null),
      });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-indigo-100 text-indigo-700',
      PACKED: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-cyan-100 text-cyan-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}