import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-vendors',
  standalone: true,
  imports: [RouterModule, DatePipe, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black text-gray-900 mb-6">Vendor Management</h1>

      <div class="flex gap-2 mb-6">
        @for (s of ['PENDING','APPROVED','REJECTED','SUSPENDED']; track s) {
          <button (click)="selectedStatus = s; loadVendors()"
                  [class]="selectedStatus === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            {{ s }}
          </button>
        }
      </div>

      @if (loading) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
          }
        </div>
      } @else if (vendors.length === 0) {
        <p class="text-gray-400 text-center py-16">No vendors with status {{ selectedStatus }}</p>
      } @else {
        <div class="space-y-3">
          @for (vendor of vendors; track vendor.id) {
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-gray-900">{{ vendor.email }}</p>
                  <p class="text-sm text-gray-500">{{ vendor.city }}, {{ vendor.state }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Registered: {{ vendor.registeredAt | date:'mediumDate' }}</p>
                  @if (vendor.adminNote) {
                    <p class="text-xs text-orange-500 mt-1">Note: {{ vendor.adminNote }}</p>
                  }
                </div>
                @if (vendor.status === 'PENDING') {
                  <div class="flex flex-col items-end gap-2">
                    <select [(ngModel)]="selectedWarehouses[vendor.id]" class="text-sm bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                      <option [ngValue]="undefined">Assign Warehouse...</option>
                      @for (w of warehouses; track w.id) {
                        <option [value]="w.id">{{w.name}} ({{w.city}})</option>
                      }
                    </select>
                    <div class="flex gap-2">
                      <button (click)="approve(vendor.id)" [disabled]="!selectedWarehouses[vendor.id]"
                              class="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                        Approve
                      </button>
                      <button (click)="openRejectModal(vendor.id)"
                              class="px-4 py-1.5 bg-rose-100 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-200 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Inline Rejection Modal ── -->
      @if (showRejectModal) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             (click)="cancelReject()">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fade-in_0.2s_ease-out]"
               (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Reject Vendor Application</h3>
            <p class="text-sm text-gray-500 mb-4">Provide a reason for rejection. This will be visible to the vendor.</p>
            <textarea [(ngModel)]="rejectReason"
                      rows="3"
                      placeholder="e.g. Incomplete business details, duplicate application..."
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none transition-all"></textarea>
            <div class="flex gap-3 mt-4 justify-end">
              <button (click)="cancelReject()"
                      class="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button (click)="confirmReject()" [disabled]="!rejectReason.trim()"
                      class="px-5 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminVendorsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private baseUrl = environment.apiUrl;

  vendors: any[] = [];
  warehouses: any[] = [];
  selectedWarehouses: Record<number, number> = {};
  loading = true;
  selectedStatus = 'PENDING';

  // Inline rejection modal
  showRejectModal = false;
  rejectingVendorId: number | null = null;
  rejectReason = '';

  ngOnInit(): void {
    this.loadVendors();
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.http.get<any>(`${this.baseUrl}/api/admin/warehouses`).subscribe({
      next: (res) => {
        this.warehouses = res.content || res || [];
      }
    });
  }

  loadVendors(): void {
    this.loading = true;
    this.http
      .get<any>(`${this.baseUrl}/api/admin/vendors?status=${this.selectedStatus}`)
      .subscribe({
        next: (res) => {
          this.vendors = res.content ?? [];
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  approve(vendorId: number): void {
    const warehouseId = this.selectedWarehouses[vendorId];
    if (!warehouseId) return;
    this.http
      .post(`${this.baseUrl}/api/admin/vendors/approve`, { vendorId, warehouseId })
      .subscribe({
        next: () => {
          delete this.selectedWarehouses[vendorId];
          this.toast.success('Vendor approved successfully.');
          this.loadVendors();
        },
        error: () => this.toast.error('Could not approve vendor. Please try again.')
      });
  }

  openRejectModal(vendorId: number): void {
    this.rejectingVendorId = vendorId;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectingVendorId = null;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (!this.rejectingVendorId || !this.rejectReason.trim()) {
      this.toast.warning('Please provide a rejection reason.');
      return;
    }
    const vendorId = this.rejectingVendorId;
    const adminNote = this.rejectReason.trim();
    this.http
      .post(`${this.baseUrl}/api/admin/vendors/reject`, { vendorId, adminNote })
      .subscribe({
        next: () => {
          this.toast.success('Vendor application rejected.');
          this.cancelReject();
          this.loadVendors();
        },
        error: () => this.toast.error('Could not reject vendor. Please try again.')
      });
  }
}