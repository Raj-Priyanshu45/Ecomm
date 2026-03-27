import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const INDIAN_STATES = [
  'ANDHRA_PRADESH','ARUNACHAL_PRADESH','ASSAM','BIHAR','CHHATTISGARH','GOA',
  'GUJARAT','HARYANA','HIMACHAL_PRADESH','JHARKHAND','KARNATAKA','KERALA',
  'MADHYA_PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA','MIZORAM','NAGALAND',
  'ODISHA','PUNJAB','RAJASTHAN','SIKKIM','TAMIL_NADU','TELANGANA','TRIPURA',
  'UTTAR_PRADESH','UTTARAKHAND','WEST_BENGAL','DELHI','JAMMU_AND_KASHMIR',
  'LADAKH','CHANDIGARH','PUDUCHERRY','ANDAMAN_AND_NICOBAR',
  'DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU','LAKSHADWEEP'
];

const STATE_OPTIONS = INDIAN_STATES.map(s => ({
  value: s,
  label: s.split('_').join(' ')
}));

@Component({
  selector: 'app-vendor-register',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30">
      <div class="max-w-xl mx-auto px-4 py-10">

        <a routerLink="/" class="inline-flex items-center gap-1.5 text-sm text-gray-500
                                  hover:text-gray-800 transition-colors mb-6 group">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </a>

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br
                      from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h1 class="text-3xl font-black text-gray-900">Become a Vendor</h1>
          <p class="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
            Register your business and start fulfilling orders through our warehouse network.
          </p>
        </div>

        @if (success) {
          <div class="bg-white rounded-2xl border border-green-100 shadow-sm p-8 text-center
                      animate-fade-in">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-xl font-black text-gray-900 mb-2">Application Submitted!</h2>
            <p class="text-gray-500 text-sm mb-6">
              Your vendor application is under review. We'll notify you once it's processed.
            </p>
            <a routerLink="/vendor/dashboard"
               class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white
                      rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Go to Dashboard
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        } @else {
          <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4 animate-fade-in">

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Business Name <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.businessName" placeholder="Acme Distributors Pvt. Ltd."
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Email <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.email" type="email" placeholder="business@example.com"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
                <input [(ngModel)]="form.phone" placeholder="+91 98765 43210"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Address Line <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.addressLine" placeholder="123, Main Street, Industrial Area"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  City <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.city" placeholder="Mumbai"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Pincode <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.pincode" placeholder="400001"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"/>
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  State <span class="text-red-400">*</span>
                </label>
                <select [(ngModel)]="form.state"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all bg-white">
                  <option value="">Select your state</option>
                  @for (s of stateOptions; track s.value) {
                    <option [value]="s.value">{{ s.label }}</option>
                  }
                </select>
              </div>
            </div>

            @if (error) {
              <div class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                {{ error }}
              </div>
            }

            <button (click)="submit()" [disabled]="submitting"
                    class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                           rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700
                           active:scale-[0.98] transition-all disabled:opacity-50
                           flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
              @if (submitting) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              } @else {
                Submit Application
              }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
  `]
})
export class VendorRegisterComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  stateOptions = STATE_OPTIONS;
  submitting = false;
  error = '';
  success = false;

  form = {
    businessName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  };

  submit(): void {
    if (!this.form.businessName || !this.form.email || !this.form.addressLine ||
        !this.form.city || !this.form.state || !this.form.pincode) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.http.post('http://localhost:8080/api/vendor/register', this.form).subscribe({
      next: () => {
        this.submitting = false;
        this.success = true;
      },
      error: (err) => {
        this.error = err.error?.mess?.[0] ?? err.error?.message ?? 'Failed to submit application.';
        this.submitting = false;
      }
    });
  }
}