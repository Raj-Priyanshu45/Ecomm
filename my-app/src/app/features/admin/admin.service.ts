import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getVendors(status: string) {
    return this.http.get(`/api/admin/vendors?status=${status}`);
  }

  approveVendor(vendorId: number) {
    return this.http.post('/api/admin/vendors/approve', { vendorId });
  }

  rejectVendor(vendorId: number, reason: string) {
    return this.http.post('/api/admin/vendors/reject', {
      vendorId,
      adminNote: reason
    });
  }
}