import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CartService } from '../cart/cart.service';
import { AddressService, Address } from '../../services/address.service';
import { PlaceOrderRequest } from '../../models/models';
import { environment } from '../../../environments/environment';

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
    <div class="min-h-screen bg-slate-950 py-10">

      <!-- Background ambient orbs -->
      <div class="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="fixed top-1/2 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 relative">

        <!-- Page Header -->
        <div class="flex items-center gap-4 mb-10">
          <a routerLink="/cart"
             class="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 class="text-3xl font-black text-white">Secure Checkout</h1>
            <p class="text-slate-500 text-sm mt-0.5">Review your delivery details and place order</p>
          </div>
        </div>

        <div class="space-y-6">

          <!-- ── Address Selection / Form ── -->
          <div class="glass-card rounded-3xl p-7">
            <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </span>
              Shipping Destination
            </h2>

            @if (savedAddresses.length > 0) {
              <div class="mb-7">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Select a saved address</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (addr of savedAddresses; track addr.id) {
                    <div (click)="selectSavedAddress(addr)"
                         class="relative cursor-pointer rounded-2xl border p-4 transition-all duration-200"
                         [class]="selectedAddressId === addr.id
                           ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                           : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'">

                      @if (selectedAddressId === addr.id) {
                        <span class="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                      }

                      <p class="font-bold text-slate-200 text-sm pr-7">{{ addr.name }}</p>
                      <p class="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {{ addr.addressLine }}, {{ addr.city }}, {{ addr.state }} {{ addr.pincode }}
                      </p>
                    </div>
                  }

                  <!-- New address tile -->
                  <div (click)="useCustomAddress()"
                       class="cursor-pointer rounded-2xl border-2 border-dashed p-4 transition-all duration-200 flex flex-col items-center justify-center min-h-[90px]"
                       [class]="selectedAddressId === null
                         ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-400'
                         : 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400'">
                    <svg class="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    <span class="font-bold text-xs">Enter new address</span>
                  </div>
                </div>
              </div>
            }

            @if (selectedAddressId === null) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div class="md:col-span-2">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                  <input [(ngModel)]="form.shippingName" placeholder="John Doe" class="input-dark"/>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address *</label>
                  <input [(ngModel)]="form.shippingAddressLine" placeholder="House/Flat No., Building Name, Area" class="input-dark"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
                  <input [(ngModel)]="form.shippingCity" placeholder="e.g. Mumbai" class="input-dark"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pincode *</label>
                  <input [(ngModel)]="form.shippingPincode" placeholder="6 digits" class="input-dark"/>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State *</label>
                  <select [(ngModel)]="form.shippingState" class="input-dark select">
                    <option value="" class="bg-slate-900">Select State</option>
                    @for (state of stateOptions; track state.value) {
                      <option [value]="state.value" class="bg-slate-900">{{ state.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number (Optional)</label>
                  <input [(ngModel)]="form.shippingPhone" placeholder="+91" class="input-dark"/>
                </div>
              </div>
            }
          </div>

          <!-- ── Order Summary + Place Order ── -->
          <div class="glass-card rounded-3xl p-7">
            <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </span>
              Payment
            </h2>

            <!-- COD badge -->
            <div class="flex items-center gap-3 p-4 glass rounded-xl border border-white/8 mb-6">
              <span class="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </span>
              <div>
                <p class="text-sm font-bold text-slate-200">Cash on Delivery</p>
                <p class="text-xs text-slate-500">Pay securely when your order arrives</p>
              </div>
              <span class="ml-auto badge-success text-xs font-bold px-3 py-1 rounded-full">Selected</span>
            </div>

            @if (error) {
              <div class="flex items-start gap-3 p-4 mb-6 badge-error rounded-xl animate-fade-in">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-medium">{{ error }}</span>
              </div>
            }

            <button (click)="placeOrder()" [disabled]="submitting"
                    class="w-full py-4 rounded-2xl font-black text-base text-white
                           bg-gradient-to-r from-indigo-600 to-violet-600
                           hover:from-indigo-500 hover:to-violet-500
                           shadow-lg shadow-indigo-500/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 active:scale-[0.98]
                           flex items-center justify-center gap-3">
              @if (submitting) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing Order...
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Place Order — Cash on Delivery
              }
            </button>

            <p class="text-xs text-slate-600 text-center mt-5">
              By placing this order, you agree to our
              <span class="text-indigo-400">terms of service</span> and
              <span class="text-indigo-400">privacy policy</span>.
              Payment collected upon delivery.
            </p>
          </div>

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
    this.http.post(`${environment.apiUrl}/api/orders`, this.form).subscribe({
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