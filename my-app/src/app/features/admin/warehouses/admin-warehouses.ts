import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../shared/services/toast.service';
import { environment } from '../../../../environments/environment';

interface Warehouse {
  id: number;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  capacity: number;
  active: boolean;
}

@Component({
  selector: 'app-admin-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-warehouses.html'
})
export class AdminWarehouses implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly base = environment.apiUrl;

  warehouses: Warehouse[] = [];
  loading = true;
  showAddForm = false;
  submitting = false;

  // New Warehouse Data
  name = '';
  addressLine = '';
  city = '';
  state = '';
  pincode = '';
  contactNumber = '';
  capacity = 1000;

  indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir'
  ];

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.loading = true;
    this.http.get<any>(`${this.base}/api/admin/warehouses`).subscribe({
      next: (res) => {
        this.warehouses = res.content || res || [];
        this.loading = false;
      },
      error: () => {
        this.warehouses = [];
        this.loading = false;
        this.toast.error('Unable to load warehouses. Please refresh the page.');
      }
    });
  }

  createWarehouse() {
    if (!this.name || !this.state || !this.city) return;
    this.submitting = true;
    const data = {
      name: this.name,
      addressLine: this.addressLine,
      city: this.city,
      state: this.state,
      pincode: this.pincode,
      contactNumber: this.contactNumber,
      capacity: this.capacity
    };

    this.http.post(`${this.base}/api/admin/warehouses`, data).subscribe({
      next: () => {
        this.submitting = false;
        this.showAddForm = false;
        this.resetForm();
        this.loadWarehouses();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mess?.[0] || 'Could not create warehouse. Please check your details and try again.';
        this.toast.error(msg);
      }
    });
  }

  resetForm() {
    this.name = '';
    this.addressLine = '';
    this.city = '';
    this.state = '';
    this.pincode = '';
    this.contactNumber = '';
    this.capacity = 1000;
  }
}
