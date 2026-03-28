import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingPhone: string;
  placedAt: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-support-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-orders.html'
})
export class SupportOrders implements OnInit {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080';

  orders: Order[] = [];
  loading = true;
  filterStatus = 'SHIPPED'; // Default to orders ready for delivery
  
  statusFilters = ['', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURN_REQUESTED', 'RETURNED'];
  
  expandedId: number | null = null;
  statusUpdates: Record<number, string> = {};
  updatingId: number | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    const statusParam = this.filterStatus ? `?status=${this.filterStatus}` : '';
    this.http.get<any>(`${this.base}/api/support/orders${statusParam}`).subscribe({
      next: (res) => {
        this.orders = res.content || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Failed to load support orders');
      }
    });
  }

  toggle(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  nextStatuses(current: string): string[] {
    const map: Record<string, string[]> = {
      'SHIPPED': ['OUT_FOR_DELIVERY'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'DELIVERY_FAILED'],
      'DELIVERY_FAILED': ['RETURNED'],
      'RETURN_REQUESTED': ['RETURNED']
    };
    return map[current] || [];
  }

  canUpdateStatus(status: string): boolean {
    return ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RETURN_REQUESTED'].includes(status);
  }

  updateStatus(orderId: number) {
    const status = this.statusUpdates[orderId];
    if (!status) return;
    
    this.updatingId = orderId;
    this.http.put(`${this.base}/api/support/orders/${orderId}/status`, { status }).subscribe({
      next: () => {
        this.updatingId = null;
        delete this.statusUpdates[orderId];
        this.loadOrders();
      },
      error: () => {
        this.updatingId = null;
        alert('Failed to update status');
      }
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      SHIPPED: 'bg-cyan-100 text-cyan-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      DELIVERY_FAILED: 'bg-red-100 text-red-700',
      RETURN_REQUESTED: 'bg-yellow-100 text-yellow-700',
      RETURNED: 'bg-gray-100 text-gray-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
