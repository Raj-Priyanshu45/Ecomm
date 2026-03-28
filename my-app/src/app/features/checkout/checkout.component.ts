import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CartService } from '../cart/cart.service';
import { AddressService, Address } from '../../services/address.service';
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

const STATE_LABELS = INDIAN_STATES.map((s) => ({
  value: s,
  label: s.split('_').join(' '),
}));

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-black text-slate-900 mb-8">Secure Checkout</h1>
      
      <div class="space-y-8">
        <!-- Address Selection / Form -->
        <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Shipping Destination
          </h2>

          @if (savedAddresses.length > 0) {
            <div class="mb-8">
              <label class="block text-sm font-bold text-slate-700 mb-4">Select a saved address</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (addr of savedAddresses; track addr.id) {
                  <div (click)="selectSavedAddress(addr)" 
                       [class]="selectedAddressId === addr.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'"
                       class="border-2 rounded-2xl p-4 cursor-pointer transition-all relative group">
                    
                    @if (selectedAddressId === addr.id) {
                      <div class="absolute top-4 right-4 text-indigo-600">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      </div>
                    }

                    <p class="font-bold text-slate-900 pr-8">{{addr.name}}</p>
                    <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{addr.addressLine}}, {{addr.city}}, {{addr.state}} {{addr.pincode}}</p>
                  </div>
                }
                
                <div (click)="useCustomAddress()"
                     [class]="selectedAddressId === null ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'"
                     class="border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[100px] border-dashed">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  <span class="font-bold text-sm">Enter new address</span>
                </div>
              </div>
            </div>
          }

          @if (selectedAddressId === null) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-[fade-in_0.3s_ease-out]">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input [(ngModel)]="form.shippingName" placeholder="John Doe"
                       class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"/>
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address *</label>
                <input [(ngModel)]="form.shippingAddressLine" placeholder="House/Flat No., Building Name, Area"
                       class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City *</label>
                <input [(ngModel)]="form.shippingCity" placeholder="e.g. Mumbai"
                       class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pincode *</label>
                <input [(ngModel)]="form.shippingPincode" placeholder="6 digits"
                       class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State *</label>
                <select [(ngModel)]="form.shippingState"
                        class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium text-slate-700">
                  <option value="">Select State</option>
                  @for (state of stateOptions; track state.value) {
                    <option [value]="state.value">{{ state.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number (Optional)</label>
                <input [(ngModel)]="form.shippingPhone" placeholder="+91"
                       class="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm"/>
              </div>
            </div>
          }
        </div>

        <!-- Place Order Box -->
        <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          @if (error) {
            <div class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ error }}</span>
            </div>
          }

          <div class="flex flex-col sm:flex-row items-center gap-4">
            <button (click)="placeOrder()" [disabled]="submitting"
                    class="w-full sm:w-auto flex-1 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
              @if (submitting) {
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Processing...
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Confirm Order (COD)
              }
            </button>
            <a routerLink="/cart" class="w-full sm:w-auto px-6 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors text-center border-2 border-transparent hover:border-slate-200">
              Return to Cart
            </a>
          </div>
          <p class="text-xs text-slate-400 text-center mt-6">By placing this order, you agree to our terms of service and privacy policy. Payment will be collected upon delivery.</p>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);
  private addressService = inject(AddressService);

  stateOptions = STATE_LABELS;
  submitting = false;
  error = '';

  savedAddresses: Address[] = [];
  selectedAddressId: number | null = null;

  form: PlaceOrderRequest = {
    shippingName: '',
    shippingAddressLine: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    shippingPhone: '',
  };

  ngOnInit() {
    this.addressService.getAddresses().subscribe({
      next: (addrs) => {
        this.savedAddresses = addrs;
        const defaultAddr = addrs.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectSavedAddress(defaultAddr);
        } else if (addrs.length > 0) {
          this.selectSavedAddress(addrs[0]);
        }
      }
    });
  }

  selectSavedAddress(addr: Address) {
    this.selectedAddressId = addr.id;
    this.form = {
      shippingName: addr.name,
      shippingAddressLine: addr.addressLine,
      shippingCity: addr.city,
      shippingState: addr.state,
      shippingPincode: addr.pincode,
      shippingPhone: addr.phone || ''
    };
  }

  useCustomAddress() {
    this.selectedAddressId = null;
    this.form = {
      shippingName: '',
      shippingAddressLine: '',
      shippingCity: '',
      shippingState: '',
      shippingPincode: '',
      shippingPhone: ''
    };
  }

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