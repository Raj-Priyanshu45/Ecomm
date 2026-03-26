import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../cart/cart.service';
import { PlaceOrderRequest } from '../../models/models';

const INDIAN_STATES = [
  'ANDHRA_PRADESH','ARUNACHAL_PRADESH','ASSAM','BIHAR','CHHATTISGARH','GOA',
  'GUJARAT','HARYANA','HIMACHAL_PRADESH','JHARKHAND','KARNATAKA','KERALA',
  'MADHYA_PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA','MIZORAM','NAGALAND',
  'ODISHA','PUNJAB','RAJASTHAN','SIKKIM','TAMIL_NADU','TELANGANA','TRIPURA',
  'UTTAR_PRADESH','UTTARAKHAND','WEST_BENGAL','DELHI','JAMMU_AND_KASHMIR',
  'LADAKH','CHANDIGARH','PUDUCHERRY','ANDAMAN_AND_NICOBAR',
  'DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU','LAKSHADWEEP'
];

// Pre-compute display labels — regex not allowed in Angular templates
const STATE_LABELS: { value: string; label: string }[] = INDIAN_STATES.map((s) => ({
  value: s,
  label: s.split('_').join(' '),
}));

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black text-gray-900 mb-6">Checkout</h1>
      <div class="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 class="font-semibold text-gray-800">Shipping Details</h2>
        <input [(ngModel)]="form.shippingName" placeholder="Full Name *"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <input [(ngModel)]="form.shippingAddressLine" placeholder="Address Line *"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <div class="grid grid-cols-2 gap-3">
          <input [(ngModel)]="form.shippingCity" placeholder="City *"
                 class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
          <input [(ngModel)]="form.shippingPincode" placeholder="Pincode *"
                 class="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>
        <select [(ngModel)]="form.shippingState"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">Select State *</option>
          @for (state of stateOptions; track state.value) {
            <option [value]="state.value">{{ state.label }}</option>
          }
        </select>
        <input [(ngModel)]="form.shippingPhone" placeholder="Phone (optional)"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        @if (error) {
          <p class="text-red-500 text-sm">{{ error }}</p>
        }
        <button (click)="placeOrder()" [disabled]="submitting"
                class="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {{ submitting ? 'Placing Order...' : 'Place Order (COD)' }}
        </button>
        <a routerLink="/cart" class="block text-center text-sm text-gray-500 hover:text-gray-700">
          ← Back to Cart
        </a>
      </div>
    </div>
  `,
})
export class CheckoutComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);

  stateOptions = STATE_LABELS;
  submitting = false;
  error = '';

  form: PlaceOrderRequest = {
    shippingName: '',
    shippingAddressLine: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    shippingPhone: '',
  };

  placeOrder(): void {
    if (!this.form.shippingName || !this.form.shippingAddressLine ||
        !this.form.shippingCity || !this.form.shippingState || !this.form.shippingPincode) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.http.post('http://localhost:8080/api/orders', this.form).subscribe({
      next: () => {
        this.cartService.setCount(0);
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.error = err.error?.mess?.[0] ?? 'Failed to place order.';
        this.submitting = false;
      },
    });
  }
}