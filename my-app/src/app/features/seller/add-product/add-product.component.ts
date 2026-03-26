import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black text-gray-900 mb-6">Add Product</h1>
      <div class="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <input [(ngModel)]="name" placeholder="Product Name *"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <textarea [(ngModel)]="description" rows="4" placeholder="Description *"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none">
        </textarea>
        <input [(ngModel)]="price" type="number" placeholder="Price (₹) *"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <input [(ngModel)]="tagsInput" placeholder="Tags (comma-separated, e.g. electronics,mobile)"
               class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        @if (error) { <p class="text-red-500 text-sm">{{ error }}</p> }
        @if (success) { <p class="text-green-600 text-sm">{{ success }}</p> }
        <button (click)="submit()" [disabled]="submitting"
                class="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {{ submitting ? 'Creating...' : 'Create Product' }}
        </button>
      </div>
    </div>
  `,
})
export class AddProductComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  name = '';
  description = '';
  price: number | null = null;
  tagsInput = '';
  submitting = false;
  error = '';
  success = '';

  submit(): void {
    if (!this.name || !this.description || !this.price) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.error = '';
    const tags = this.tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    this.http
      .post('http://localhost:8080/api/products', {
        name: this.name,
        description: this.description,
        price: this.price,
        tags,
      })
      .subscribe({
        next: (res: any) => {
          this.success = `Product "${this.name}" created! ID: ${res.productId}`;
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/products', res.productId]), 1500);
        },
        error: (err) => {
          this.error = err.error?.mess?.[0] ?? 'Failed to create product.';
          this.submitting = false;
        },
      });
  }
}