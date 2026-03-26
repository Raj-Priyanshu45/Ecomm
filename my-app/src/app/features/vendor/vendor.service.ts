import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);

  getProfile() {
    return this.http.get('/api/vendor/me');
  }

  getNotifications(unreadOnly: boolean) {
    return this.http.get(`/api/vendor/notifications?unreadOnly=${unreadOnly}&page=0&size=20`);
  }

  markAllRead() {
    return this.http.put('/api/vendor/notifications/read', {});
  }
}