import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DecimalPipe, DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

interface VendorProfile {
  id: number;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  status: string;
  adminNote: string;
  warehouseId: number;
  warehouseName: string;
  registeredAt: string;
}

interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtOrder: number;
  lineTotal: number;
  skuCode: string;
}

interface VendorOrder {
  orderId: number;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  warehouseId: number;
  warehouseName: string;
  items: OrderItem[];
  placedAt: string;
  updatedAt: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
}

const STATUS_FLOW: Record<string, string | null> = {
  PAYMENT_CONFIRMED: 'CONFIRMED',
  CONFIRMED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: null,
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURN_PICKED_UP: 'Return Picked Up',
  REFUNDED: 'Refunded',
  DELIVERY_FAILED: 'Delivery Failed',
};

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterModule, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">

      <!-- Animated background blobs -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style="animation-delay:1s"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Header Row -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Vendor Dashboard</h1>
            <p class="text-gray-500 text-sm mt-1">Manage your warehouse orders & profile</p>
          </div>

          <!-- Notification Bell -->
          <button (click)="showNotifications = !showNotifications; markRead()"
                  class="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200
                         rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span class="text-sm font-medium text-gray-700">Notifications</span>
            @if (unreadCount > 0) {
              <span class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs
                           font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1
                           animate-bounce">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            }
          </button>
        </div>

        <!-- Notification Panel -->
        @if (showNotifications) {
          <div class="mb-6 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden
                      animate-slide-down">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 class="font-bold text-gray-900">Notifications</h2>
              <button (click)="showNotifications = false" class="text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
              @if (notifications.length === 0) {
                <p class="text-center text-gray-400 py-8 text-sm">No notifications yet</p>
              }
              @for (n of notifications; track n.id) {
                <div [class]="n.read ? 'bg-white' : 'bg-indigo-50/50'"
                     class="px-5 py-4 transition-colors hover:bg-gray-50">
                  <div class="flex items-start gap-3">
                    <div [class]="n.read ? 'bg-gray-200' : 'bg-indigo-500'"
                         class="w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-sm text-gray-900">{{ n.title }}</p>
                      <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ n.message }}</p>
                      <p class="text-xs text-gray-300 mt-1">{{ n.createdAt | date:'short' }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Stats Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (stat of stats; track stat.label) {
            <div class="group bg-white rounded-2xl border border-gray-100 p-5
                        hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                 [style]="'--accent:' + stat.color">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">{{ stat.icon }}</span>
                <span class="text-xs font-semibold px-2 py-1 rounded-full"
                      [style]="'background:' + stat.color + '20; color:' + stat.color">
                  {{ stat.change }}
                </span>
              </div>
              <p class="text-2xl font-black text-gray-900">{{ stat.value }}</p>
              <p class="text-xs text-gray-500 mt-0.5 font-medium">{{ stat.label }}</p>
            </div>
          }
        </div>

        <!-- Two column layout -->
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Orders (main column) -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <!-- Tab Bar -->
              <div class="flex border-b border-gray-100 overflow-x-auto">
                @for (tab of orderTabs; track tab.status) {
                  <button (click)="selectedStatus = tab.status; loadOrders()"
                          [class]="selectedStatus === tab.status
                            ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
                          class="px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0">
                    {{ tab.label }}
                    @if (tab.count > 0) {
                      <span class="ml-1.5 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 text-xs">
                        {{ tab.count }}
                      </span>
                    }
                  </button>
                }
              </div>

              <!-- Order List -->
              <div class="divide-y divide-gray-50">
                @if (loadingOrders) {
                  @for (i of [1,2,3]; track i) {
                    <div class="p-5 animate-pulse">
                      <div class="flex gap-3">
                        <div class="h-10 w-10 bg-gray-100 rounded-xl"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-4 bg-gray-100 rounded w-1/3"></div>
                          <div class="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  }
                } @else if (orders.length === 0) {
                  <div class="flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <p class="text-sm font-medium">No {{ selectedStatus.toLowerCase() }} orders</p>
                  </div>
                } @else {
                  @for (order of orders; track order.orderId) {
                    <div class="p-5 hover:bg-gray-50/50 transition-colors">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3 flex-1 min-w-0">
                          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                            </svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="font-bold text-gray-900 text-sm">Order #{{ order.orderId }}</span>
                              <span [class]="getStatusClass(order.status)"
                                    class="text-xs px-2 py-0.5 rounded-full font-medium">
                                {{ STATUS_LABELS[order.status] || order.status }}
                              </span>
                            </div>
                            <p class="text-xs text-gray-500 mt-0.5">
                              {{ order.shippingName }} — {{ order.shippingCity }}, {{ order.shippingState }}
                            </p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ order.placedAt | date:'mediumDate' }}</p>

                            <!-- Items -->
                            @if (expandedOrder === order.orderId) {
                              <div class="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                                @for (item of order.items; track item.orderItemId) {
                                  <div class="flex justify-between text-xs text-gray-600">
                                    <span class="truncate mr-2">
                                      {{ item.productName }}
                                      @if (item.skuCode) {
                                        <span class="text-gray-400">({{ item.skuCode }})</span>
                                      }
                                      × {{ item.quantity }}
                                    </span>
                                    <span class="font-medium flex-shrink-0">₹{{ item.lineTotal | number:'1.0-0' }}</span>
                                  </div>
                                }
                                <div class="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
                                  <span>Total</span>
                                  <span>₹{{ order.totalAmount | number:'1.0-0' }}</span>
                                </div>
                              </div>
                            }
                          </div>
                        </div>

                        <div class="flex flex-col items-end gap-2 flex-shrink-0">
                          <span class="font-bold text-gray-900 text-sm">₹{{ order.totalAmount | number:'1.0-0' }}</span>

                          @if (getNextStatus(order.status)) {
                            <button (click)="advanceOrder(order.orderId, getNextStatus(order.status)!)"
                                    [disabled]="updatingOrders[order.orderId]"
                                    class="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg
                                           hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium">
                              {{ updatingOrders[order.orderId] ? '...' : 'Mark ' + STATUS_LABELS[getNextStatus(order.status)!] }}
                            </button>
                          }

                          <button (click)="expandedOrder = expandedOrder === order.orderId ? null : order.orderId"
                                  class="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            {{ expandedOrder === order.orderId ? 'Less' : 'Details' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="space-y-5">

            <!-- Profile Card -->
            @if (profile) {
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600
                              rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {{ profile.email[0].toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-900 text-sm truncate max-w-[150px]">{{ profile.email }}</p>
                    <span [class]="profile.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : profile.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-600'"
                      class="text-xs px-2 py-0.5 rounded-full font-medium">
                      {{ profile.status }}
                    </span>
                  </div>
                </div>

                <div class="space-y-2.5 text-sm">
                  @if (profile.warehouseName) {
                    <div class="flex items-center gap-2 text-gray-600">
                      <svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      <span>{{ profile.warehouseName }}</span>
                    </div>
                  }
                  <div class="flex items-center gap-2 text-gray-600">
                    <svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{{ profile.city }}, {{ profile.state }}</span>
                  </div>
                  @if (profile.adminNote) {
                    <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                      <span class="font-semibold">Admin Note: </span>{{ profile.adminNote }}
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Status Guide -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 class="font-bold text-gray-900 text-sm mb-3">Order Flow Guide</h3>
              <div class="space-y-2">
                @for (step of flowSteps; track step.from) {
                  <div class="flex items-center gap-2 text-xs text-gray-600">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                          [class]="step.active ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </span>
                    <span>{{ step.from }}</span>
                    <svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    <span class="text-indigo-600 font-medium">{{ step.to }}</span>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-down {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-down { animation: slide-down 0.2s ease-out; }
  `]
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  profile: VendorProfile | null = null;
  orders: VendorOrder[] = [];
  notifications: Notification[] = [];
  loadingOrders = true;
  showNotifications = false;
  selectedStatus = 'PAYMENT_CONFIRMED';
  expandedOrder: number | null = null;
  unreadCount = 0;
  updatingOrders: Record<number, boolean> = {};
  private pollSub?: Subscription;

  STATUS_LABELS = STATUS_LABELS;

  orderTabs = [
    { status: 'PAYMENT_CONFIRMED', label: 'New', count: 0 },
    { status: 'CONFIRMED', label: 'Confirmed', count: 0 },
    { status: 'PACKED', label: 'Packed', count: 0 },
    { status: 'SHIPPED', label: 'Shipped', count: 0 },
  ];

  flowSteps = [
    { from: 'Payment Confirmed', to: 'Confirmed', active: false },
    { from: 'Confirmed', to: 'Packed', active: false },
    { from: 'Packed', to: 'Shipped', active: false },
  ];

  stats = [
    { label: 'New Orders', value: '0', icon: '📦', color: '#6366f1', change: 'Today' },
    { label: 'Packed', value: '0', icon: '📫', color: '#8b5cf6', change: 'Active' },
    { label: 'Shipped', value: '0', icon: '🚚', color: '#06b6d4', change: 'Transit' },
    { label: 'Notifications', value: '0', icon: '🔔', color: '#f59e0b', change: 'Unread' },
  ];

  ngOnInit(): void {
    this.loadProfile();
    this.loadOrders();
    this.loadNotifications();
    // Poll for new notifications every 30s
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.http.get<any>(`${this.baseUrl}/api/vendor/notifications?unreadOnly=true&size=1`))
    ).subscribe(res => {
      this.unreadCount = res.totalElements ?? 0;
      this.stats[3].value = String(this.unreadCount);
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadProfile(): void {
    this.http.get<VendorProfile>(`${this.baseUrl}/api/vendor/me`).subscribe({
      next: (p) => (this.profile = p),
      error: () => {}
    });
  }

  loadOrders(): void {
    if (!this.profile?.warehouseId) {
      // Try loading after profile
      this.http.get<VendorProfile>(`${this.baseUrl}/api/vendor/me`).subscribe({
        next: (p) => {
          this.profile = p;
          if (p.warehouseId) this.fetchOrders(p.warehouseId);
        }
      });
      return;
    }
    this.fetchOrders(this.profile.warehouseId);
  }

  private fetchOrders(warehouseId: number): void {
    this.loadingOrders = true;
    this.http.get<any>(
      `${this.baseUrl}/api/vendor/orders?warehouseId=${warehouseId}&status=${this.selectedStatus}&page=0&size=20`
    ).subscribe({
      next: (res) => {
        this.orders = res.content ?? [];
        this.loadingOrders = false;
        this.updateStats();
      },
      error: () => (this.loadingOrders = false)
    });
  }

  loadNotifications(): void {
    this.http.get<any>(`${this.baseUrl}/api/vendor/notifications?page=0&size=20`).subscribe({
      next: (res) => {
        this.notifications = res.content ?? [];
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.stats[3].value = String(this.unreadCount);
      }
    });
  }

  markRead(): void {
    if (this.unreadCount > 0) {
      this.http.put(`${this.baseUrl}/api/vendor/notifications/read`, {}).subscribe({
        next: () => {
          this.notifications.forEach(n => (n.read = true));
          this.unreadCount = 0;
          this.stats[3].value = '0';
        }
      });
    }
  }

  advanceOrder(orderId: number, nextStatus: string): void {
    this.updatingOrders[orderId] = true;
    this.http.put(`${this.baseUrl}/api/vendor/orders/${orderId}/status`, { status: nextStatus })
      .subscribe({
        next: () => {
          this.updatingOrders[orderId] = false;
          this.loadOrders();
        },
        error: () => (this.updatingOrders[orderId] = false)
      });
  }

  getNextStatus(current: string): string | null {
    return STATUS_FLOW[current] ?? null;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-indigo-100 text-indigo-700',
      PACKED: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-cyan-100 text-cyan-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  private updateStats(): void {
    this.stats[0].value = String(this.orders.filter(o => o.status === 'PAYMENT_CONFIRMED').length);
    this.stats[1].value = String(this.orders.filter(o => o.status === 'PACKED').length);
    this.stats[2].value = String(this.orders.filter(o => o.status === 'SHIPPED').length);
  }
}