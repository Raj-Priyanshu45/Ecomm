import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black text-gray-900 mb-6">Vendor Dashboard</h1>

      @if (loading) {
        <div class="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
      } @else if (!profile) {
        <!-- Registration form -->
        <div class="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 class="font-semibold text-gray-800">Register as Vendor</h2>
          <p class="text-sm text-gray-500">Submit your vendor application to start selling.</p>
          <a routerLink="/vendor/register"
             class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Apply Now
          </a>
        </div>
      } @else {
        <!-- Profile card -->
        <div class="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-lg text-gray-900">{{ profile.email }}</h2>
              <p class="text-sm text-gray-500">{{ profile.city }}, {{ profile.state }}</p>
            </div>
            <span [class]="statusClass(profile.status)"
                  class="text-sm px-3 py-1 rounded-full font-medium">
              {{ profile.status }}
            </span>
          </div>
          @if (profile.adminNote) {
            <div class="mt-4 bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              <span class="font-medium">Admin note:</span> {{ profile.adminNote }}
            </div>
          }
          @if (profile.warehouseName) {
            <p class="mt-3 text-sm text-indigo-600 font-medium">
              📦 Assigned to: {{ profile.warehouseName }}
            </p>
          }
        </div>

        <!-- Notifications -->
        <div class="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Recent Notifications</h3>
          @if (notifications.length === 0) {
            <p class="text-sm text-gray-400">No notifications yet.</p>
          }
          @for (n of notifications; track n.id) {
            <div [class]="n.read ? 'opacity-60' : ''"
                 class="border-b border-gray-50 py-3 last:border-0">
              <p class="text-sm font-semibold text-gray-800">{{ n.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ n.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ n.createdAt | date:'short' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class VendorDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  profile: any = null;
  notifications: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.http.get(`${this.baseUrl}/api/vendor/me`).subscribe({
      next: (p) => {
        this.profile = p;
        this.loading = false;
        this.loadNotifications();
      },
      error: () => (this.loading = false),
    });
  }

  loadNotifications(): void {
    this.http
      .get<any>(`${this.baseUrl}/api/vendor/notifications?size=10`)
      .subscribe({ next: (res) => (this.notifications = res.content ?? []) });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      SUSPENDED: 'bg-gray-100 text-gray-600',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}