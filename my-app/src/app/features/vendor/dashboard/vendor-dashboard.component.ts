import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterModule, DatePipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black text-gray-900 mb-6">Vendor Dashboard</h1>

      @if (profile) {
        <div class="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 class="font-semibold text-gray-800 mb-4">My Profile</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Business Name</p>
              <p class="font-medium text-gray-900">{{ profile.businessName }}</p>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <span [class]="statusClass(profile.status)"
                    class="text-xs px-3 py-1 rounded-full font-medium">
                {{ profile.status }}
              </span>
            </div>
            <div>
              <p class="text-gray-500">Email</p>
              <p class="font-medium text-gray-900">{{ profile.email }}</p>
            </div>
            <div>
              <p class="text-gray-500">City / State</p>
              <p class="font-medium text-gray-900">{{ profile.city }}, {{ profile.state }}</p>
            </div>
          </div>
          @if (profile.adminNote) {
            <div class="mt-4 p-3 bg-orange-50 rounded-xl text-sm text-orange-700">
              Admin note: {{ profile.adminNote }}
            </div>
          }
        </div>
      }

      <div class="mb-6">
        <h2 class="font-semibold text-gray-800 mb-3">Notifications</h2>
        <div class="flex gap-2 mb-4">
          <button (click)="loadNotifications(false)"
                  class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">
            All
          </button>
          <button (click)="loadNotifications(true)"
                  class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
            Unread
          </button>
          <button (click)="markAllRead()"
                  class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
            Mark All Read
          </button>
        </div>

        @if (notifications.length === 0) {
          <p class="text-gray-400 text-sm text-center py-8">No notifications</p>
        } @else {
          <div class="space-y-3">
            @for (n of notifications; track n.id) {
              <div [class]="n.read ? 'border-gray-100' : 'border-indigo-200'"
                   class="bg-white border rounded-2xl p-4">
                <div class="flex justify-between items-start mb-1">
                  <p class="font-semibold text-gray-900 text-sm">{{ n.title }}</p>
                  <span [class]="n.read ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'"
                        class="text-xs px-2 py-0.5 rounded-full">
                    {{ n.read ? 'Read' : 'Unread' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600">{{ n.message }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ n.createdAt | date:'medium' }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class VendorDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080';

  profile: any = null;
  notifications: any[] = [];

  ngOnInit(): void {
    this.loadProfile();
    this.loadNotifications(false);
  }

  loadProfile(): void {
    this.http.get<any>(`${this.baseUrl}/api/vendor/me`).subscribe({
      next: (res) => (this.profile = res),
    });
  }

  loadNotifications(unreadOnly: boolean): void {
    this.http
      .get<any>(`${this.baseUrl}/api/vendor/notifications?unreadOnly=${unreadOnly}&page=0&size=20`)
      .subscribe({
        next: (res) => (this.notifications = res.content ?? []),
      });
  }

  markAllRead(): void {
    this.http.put(`${this.baseUrl}/api/vendor/notifications/read`, {}).subscribe({
      next: () => this.loadNotifications(false),
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      SUSPENDED: 'bg-gray-100 text-gray-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}