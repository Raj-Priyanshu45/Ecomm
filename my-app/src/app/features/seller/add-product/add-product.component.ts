import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white">
      <div class="max-w-2xl mx-auto px-4 py-8">

        <!-- Back link -->
        <a routerLink="/"
           class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
                  transition-colors mb-6 group">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to shop
        </a>

        <div class="mb-6">
          <h1 class="text-3xl font-black text-gray-900">Add Product</h1>
          <p class="text-gray-500 text-sm mt-1">
            @if (!productId) { Fill in the details to create your listing. }
            @else { Product created! Now upload images to make it shine. }
          </p>
        </div>

        <!-- Progress Steps -->
        <div class="flex items-center gap-3 mb-8">
          <div class="flex items-center gap-2">
            <div [class]="step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'"
                 class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors">
              @if (step > 1) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              } @else { 1 }
            </div>
            <span [class]="step >= 1 ? 'text-indigo-700 font-semibold' : 'text-gray-400'"
                  class="text-sm transition-colors">Details</span>
          </div>
          <div [class]="step >= 2 ? 'bg-indigo-400' : 'bg-gray-200'"
               class="flex-1 h-0.5 rounded transition-colors"></div>
          <div class="flex items-center gap-2">
            <div [class]="step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'"
                 class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors">2</div>
            <span [class]="step >= 2 ? 'text-indigo-700 font-semibold' : 'text-gray-400'"
                  class="text-sm transition-colors">Images</span>
          </div>
        </div>

        <!-- Step 1: Product Details -->
        @if (step === 1) {
          <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5
                      animate-fade-in">

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product Name <span class="text-red-400">*</span></label>
              <input [(ngModel)]="name"
                     placeholder="e.g. Wireless Noise-Cancelling Headphones"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                            transition-all placeholder:text-gray-300"/>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Description <span class="text-red-400">*</span></label>
              <textarea [(ngModel)]="description" rows="4"
                        placeholder="Describe your product clearly — features, material, use-case…"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                               transition-all resize-none placeholder:text-gray-300">
              </textarea>
              <p class="text-xs text-gray-400 mt-1 text-right">{{ description.length }} chars</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Price (₹) <span class="text-red-400">*</span></label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                <input [(ngModel)]="price" type="number" min="0" step="0.01"
                       placeholder="0.00"
                       class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                              focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                              transition-all placeholder:text-gray-300"/>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
              <input [(ngModel)]="tagsInput"
                     placeholder="electronics, wireless, audio  (comma-separated)"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                            transition-all placeholder:text-gray-300"/>
              <!-- Tag preview -->
              @if (parsedTags.length > 0) {
                <div class="flex flex-wrap gap-1.5 mt-2">
                  @for (tag of parsedTags; track tag) {
                    <span class="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      {{ tag }}
                    </span>
                  }
                </div>
              }
            </div>

            @if (error) {
              <div class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                {{ error }}
              </div>
            }

            <button (click)="createProduct()" [disabled]="submitting"
                    class="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold
                           hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50
                           flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
              @if (submitting) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creating…
              } @else {
                Continue to Images
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </div>
        }

        <!-- Step 2: Image Upload -->
        @if (step === 2) {
          <div class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5 animate-fade-in">

            <!-- Success banner -->
            <div class="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <div>
                <p class="text-sm font-semibold text-green-800">"{{ name }}" created successfully!</p>
                <p class="text-xs text-green-600">Product ID: {{ productId }}</p>
              </div>
            </div>

            <!-- Drop Zone -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Upload Images
                <span class="font-normal text-gray-400 ml-1">(PNG, JPG, WebP · max 5MB each)</span>
              </label>

              <label class="group flex flex-col items-center justify-center w-full h-40
                            border-2 border-dashed border-gray-200 rounded-xl
                            hover:border-indigo-400 hover:bg-indigo-50/30
                            transition-all cursor-pointer"
                     [class.border-indigo-400]="selectedFiles.length > 0"
                     [class.bg-indigo-50]="selectedFiles.length > 0">
                <input type="file" multiple accept="image/*"
                       class="hidden" (change)="onFilesSelected($event)"/>
                @if (selectedFiles.length === 0) {
                  <svg class="w-10 h-10 text-gray-300 mb-2 group-hover:text-indigo-400 transition-colors"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-sm text-gray-400 group-hover:text-indigo-500 transition-colors">
                    Click to browse or drag & drop
                  </p>
                } @else {
                  <p class="text-indigo-600 font-semibold text-sm">{{ selectedFiles.length }} file(s) selected</p>
                  <p class="text-xs text-gray-400 mt-1">Click to change</p>
                }
              </label>

              <!-- File previews -->
              @if (previews.length > 0) {
                <div class="grid grid-cols-4 gap-2 mt-3">
                  @for (preview of previews; track $index) {
                    <div class="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                         [class.ring-2]="primaryIndex === $index"
                         [class.ring-indigo-500]="primaryIndex === $index"
                         (click)="primaryIndex = $index">
                      <img [src]="preview" class="w-full h-full object-cover"/>
                      @if (primaryIndex === $index) {
                        <div class="absolute bottom-0 inset-x-0 bg-indigo-600 py-0.5">
                          <p class="text-white text-center text-[9px] font-bold">PRIMARY</p>
                        </div>
                      }
                    </div>
                  }
                </div>
                <p class="text-xs text-gray-400 mt-2">Tap an image to set as primary (cover) photo</p>
              }
            </div>

            @if (uploadError) {
              <div class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                {{ uploadError }}
              </div>
            }

            <div class="flex gap-3">
              <button (click)="uploadImages()" [disabled]="uploading || selectedFiles.length === 0"
                      class="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold
                             hover:bg-indigo-700 transition-all disabled:opacity-50
                             flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
                @if (uploading) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Uploading…
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Upload {{ selectedFiles.length }} Image(s)
                }
              </button>
              <button (click)="goToProduct()"
                      class="px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl
                             font-medium hover:bg-gray-50 transition-all text-sm">
                Skip →
              </button>
            </div>
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
export class AddProductComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  step = 1;
  productId: number | null = null;

  // Step 1
  name = '';
  description = '';
  price: number | null = null;
  tagsInput = '';
  submitting = false;
  error = '';

  // Step 2
  selectedFiles: File[] = [];
  previews: string[] = [];
  primaryIndex = 0;
  uploading = false;
  uploadError = '';

  get parsedTags(): string[] {
    return this.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedFiles = Array.from(input.files);
    this.previews = [];
    this.primaryIndex = 0;
    this.selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => this.previews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  createProduct(): void {
    if (!this.name.trim() || !this.description.trim() || !this.price) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.http.post<{ productId: number }>('http://localhost:8080/api/products', {
      name: this.name,
      description: this.description,
      price: this.price,
      tags: this.parsedTags,
    }).subscribe({
      next: (res) => {
        this.productId = res.productId;
        this.submitting = false;
        this.step = 2;
      },
      error: (err) => {
        this.error = err.error?.mess?.[0] ?? 'Failed to create product.';
        this.submitting = false;
      }
    });
  }

  uploadImages(): void {
    if (!this.productId || this.selectedFiles.length === 0) return;
    this.uploading = true;
    this.uploadError = '';

    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('images', f));
    formData.append('primaryKey', String(this.primaryIndex));

    this.http.post(
      `http://localhost:8080/api/products/${this.productId}/images`,
      formData
    ).subscribe({
      next: () => {
        this.uploading = false;
        this.goToProduct();
      },
      error: (err) => {
        this.uploadError = err.error?.mess?.[0] ?? 'Failed to upload images.';
        this.uploading = false;
      }
    });
  }

  goToProduct(): void {
    this.router.navigate(['/products', this.productId]);
  }
}