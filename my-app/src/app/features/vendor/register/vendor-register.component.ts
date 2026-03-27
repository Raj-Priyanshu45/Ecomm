import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const INDIAN_STATES: { value: string; label: string }[] = [
  'ANDHRA_PRADESH', 'ARUNACHAL_PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH',
  'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL_PRADESH', 'JHARKHAND', 'KARNATAKA',
  'KERALA', 'MADHYA_PRADESH', 'MAHARASHTRA', 'MANIPUR', 'MEGHALAYA',
  'MIZORAM', 'NAGALAND', 'ODISHA', 'PUNJAB', 'RAJASTHAN', 'SIKKIM',
  'TAMIL_NADU', 'TELANGANA', 'TRIPURA', 'UTTAR_PRADESH', 'UTTARAKHAND',
  'WEST_BENGAL', 'DELHI', 'JAMMU_AND_KASHMIR', 'LADAKH', 'CHANDIGARH',
  'PUDUCHERRY', 'ANDAMAN_AND_NICOBAR', 'DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU',
  'LAKSHADWEEP',
].map(s => ({ value: s, label: s.split('_').join(' ') }));

interface VendorProfile {
  id: number;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  adminNote: string | null;
  warehouseName: string | null;
  registeredAt: string;
}

@Component({
  selector: 'app-vendor-register',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-white">
      <div class="max-w-2xl mx-auto px-4 py-10">

        <!-- Back -->
        <a routerLink="/"
           class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
                  transition-colors mb-8 group">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to shop
        </a>

        <!-- ── Loading ── -->
        @if (loading) {
          <div class="flex items-center justify-center py-24">
            <svg class="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        }

        <!-- ── Already Applied → Status Card ── -->
        @else if (existingProfile) {
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                        {{ existingProfile.status === 'APPROVED' ? 'bg-green-100' :
                           existingProfile.status === 'REJECTED' ? 'bg-red-100' :
                           existingProfile.status === 'SUSPENDED' ? 'bg-orange-100' : 'bg-yellow-100' }}">
              @if (existingProfile.status === 'APPROVED') {
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              } @else if (existingProfile.status === 'REJECTED') {
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              } @else {
                <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            </div>
            <h1 class="text-3xl font-black text-gray-900">Vendor Application</h1>
            <p class="text-gray-500 text-sm mt-1">You've already submitted an application</p>
          </div>

          <!-- Status Card -->
          <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <!-- Status Banner -->
            <div class="{{ statusBannerClass }} px-6 py-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider opacity-75">Application Status</p>
                  <p class="text-2xl font-black mt-0.5">{{ existingProfile.status }}</p>
                </div>
                <div class="text-4xl">
                  {{ existingProfile.status === 'APPROVED' ? '🎉' :
                     existingProfile.status === 'REJECTED' ? '😔' :
                     existingProfile.status === 'SUSPENDED' ? '⚠️' : '⏳' }}
                </div>
              </div>
            </div>

            <!-- Details -->
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Email</p>
                  <p class="text-gray-800 font-medium mt-0.5">{{ existingProfile.email }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Phone</p>
                  <p class="text-gray-800 font-medium mt-0.5">{{ existingProfile.phone || '—' }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">City</p>
                  <p class="text-gray-800 font-medium mt-0.5">{{ existingProfile.city }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">State</p>
                  <p class="text-gray-800 font-medium mt-0.5">{{ existingProfile.state.split('_').join(' ') }}</p>
                </div>
                <div>
                  <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Applied On</p>
                  <p class="text-gray-800 font-medium mt-0.5">{{ formatDate(existingProfile.registeredAt) }}</p>
                </div>
                @if (existingProfile.warehouseName) {
                  <div>
                    <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Warehouse</p>
                    <p class="text-gray-800 font-medium mt-0.5">{{ existingProfile.warehouseName }}</p>
                  </div>
                }
              </div>

              @if (existingProfile.adminNote) {
                <div class="{{ existingProfile.status === 'APPROVED'
                               ? 'bg-green-50 border-green-200 text-green-800'
                               : 'bg-orange-50 border-orange-200 text-orange-800' }}
                             border rounded-xl px-4 py-3 text-sm">
                  <p class="font-semibold mb-0.5">Admin Note</p>
                  <p>{{ existingProfile.adminNote }}</p>
                </div>
              }

              <!-- Status-specific messages -->
              @if (existingProfile.status === 'PENDING') {
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
                  <p class="font-semibold">Under Review</p>
                  <p class="mt-0.5">Our admin team is reviewing your application. You'll receive a notification once it's processed — usually within 24–48 hours.</p>
                </div>
              }

              @if (existingProfile.status === 'APPROVED') {
                <a routerLink="/vendor/dashboard"
                   class="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white
                          rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  Go to Vendor Dashboard
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              }
            </div>
          </div>
        }

        <!-- ── Registration Form ── -->
        @else {
          <div class="mb-8">
            <h1 class="text-3xl font-black text-gray-900">Become a Vendor</h1>
            <p class="text-gray-500 text-sm mt-1">
              Fill in your business details and our team will review your application.
            </p>
          </div>

          <!-- What happens next -->
          <div class="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-6">
            <p class="text-sm font-semibold text-purple-800 mb-3">What happens after you apply?</p>
            <div class="space-y-2.5">
              @for (step of steps; track step.num) {
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex-shrink-0
                               flex items-center justify-center text-xs font-bold">
                    {{ step.num }}
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-purple-900">{{ step.title }}</p>
                    <p class="text-xs text-purple-700 mt-0.5">{{ step.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business Name <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.businessName"
                       placeholder="e.g. Sharma Electronics Pvt Ltd"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.email" type="email"
                       placeholder="business@email.com"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input [(ngModel)]="form.phone" placeholder="9999999999"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Address Line <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.addressLine"
                       placeholder="Street, Building, Area"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  City <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.city" placeholder="Bangalore"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pincode <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="form.pincode" placeholder="560001"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                              transition-all placeholder:text-gray-300"/>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  State <span class="text-red-400">*</span>
                </label>
                <select [(ngModel)]="form.state"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                               transition-all bg-white">
                  <option value="">Select State</option>
                  @for (s of stateOptions; track s.value) {
                    <option [value]="s.value">{{ s.label }}</option>
                  }
                </select>
              </div>
            </div>

            @if (error) {
              <div class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600
                          flex items-start gap-2">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                {{ error }}
              </div>
            }

            <button (click)="submit()" [disabled]="submitting"
                    class="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold
                           hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50
                           flex items-center justify-center gap-2 shadow-sm shadow-purple-200">
              @if (submitting) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting Application…
              } @else {
                Submit Application
              }
            </button>

          </div>
        }
      </div>
    </div>
  `,
})
export class VendorRegisterComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080';

  loading = true;
  submitting = false;
  error = '';
  existingProfile: VendorProfile | null = null;

  stateOptions = INDIAN_STATES;

  steps = [
    { num: 1, title: 'Submit Your Application', desc: 'Fill in your business details below.' },
    { num: 2, title: 'Admin Review (24–48 hrs)', desc: 'Our team reviews your application and assigns a warehouse.' },
    { num: 3, title: 'Get Notified', desc: "You'll receive a notification with the decision." },
    { num: 4, title: 'Start Selling', desc: 'Once approved, access your vendor dashboard and manage inventory.' },
  ];

  form = {
    businessName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  };

  ngOnInit(): void {
    // Check if user already has a vendor profile
    this.http.get<VendorProfile>(`${this.base}/api/vendor/me`).subscribe({
      next: (profile) => {
        this.existingProfile = profile;
        this.loading = false;
      },
      error: (err) => {
        // 403 = no vendor profile yet → show form
        // Any other error → also show form (backend will validate)
        this.existingProfile = null;
        this.loading = false;
      },
    });
  }

  get statusBannerClass(): string {
    const map: Record<string, string> = {
      APPROVED:  'bg-green-600 text-white',
      REJECTED:  'bg-red-500 text-white',
      SUSPENDED: 'bg-orange-500 text-white',
      PENDING:   'bg-yellow-400 text-yellow-900',
    };
    return map[this.existingProfile?.status ?? 'PENDING'] ?? 'bg-yellow-400 text-yellow-900';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  submit(): void {
    const { businessName, email, addressLine, city, state, pincode } = this.form;
    if (!businessName || !email || !addressLine || !city || !state || !pincode) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.error = '';

    this.http.post<VendorProfile>(`${this.base}/api/vendor/register`, this.form).subscribe({
      next: (profile) => {
        this.existingProfile = profile;
        this.submitting = false;
      },
      error: (err) => {
        // 409 = already applied (now returned correctly from backend)
        if (err.status === 409) {
          this.error = err.error?.mess?.[0] ?? 'You have already submitted an application.';
          // Also try to load their profile
          this.http.get<VendorProfile>(`${this.base}/api/vendor/me`).subscribe({
            next: (p) => { this.existingProfile = p; },
            error: () => {},
          });
        } else {
          this.error = err.error?.mess?.[0] ?? 'Failed to submit application. Please try again.';
        }
        this.submitting = false;
      },
    });
  }
}