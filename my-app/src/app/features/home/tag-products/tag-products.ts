import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { AllProductResponse } from '../../../models/models';
import { CartService } from '../../cart/cart.service';

@Component({
  selector: 'app-tag-products',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Tag Header Banner -->
      <div class="bg-indigo-600 text-white py-12 px-4 shadow-inner">
        <div class="max-w-7xl mx-auto text-center animate-[slide-down_0.5s_ease-out]">
          <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-indigo-100 text-sm font-bold tracking-wider uppercase mb-3 border border-white/20">
            Tag Filter
          </span>
          <h1 class="text-4xl md:text-5xl font-black mb-4">
            Products tagged with "{{ tagSlug }}"
          </h1>
          <p class="text-indigo-100 max-w-2xl mx-auto">
            Browse our collection of items specifically matching your selected tag.
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex justify-between items-center mb-8">
          <p class="text-slate-600 font-medium">
            Showing <span class="font-bold text-slate-900">{{ products.length }}</span> results
          </p>
          <a routerLink="/" class="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to all products
          </a>
        </div>

        @if (loading) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="bg-white rounded-2xl border border-slate-100 p-4 h-80 animate-pulse">
                <div class="bg-slate-100 h-48 rounded-xl mb-4"></div>
                <div class="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-slate-100 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else if (products.length === 0) {
          <div class="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-2xl mx-auto">
            <span class="text-6xl block mb-4">🏷️</span>
            <h3 class="text-xl font-bold text-slate-800">No matches found</h3>
            <p class="text-slate-500 mt-2 mb-6">We couldn't find any products with the tag "{{ tagSlug }}".</p>
            <a routerLink="/" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-block">
              Clear filter
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (p of products; track p.id) {
              <app-product-card 
                [product]="p" 
                (addToCart)="onAddToCart($event)"
                class="animate-[fade-in_0.5s_ease-out]">
              </app-product-card>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class TagProducts implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  tagSlug = '';
  products: AllProductResponse[] = [];
  loading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.tagSlug = params.get('slug') || '';
      this.loadProductsForTag();
    });
  }

  loadProductsForTag() {
    this.loading = true;
    this.http.get<any>(`http://localhost:8080/api/browse/products/tag/${this.tagSlug}`).subscribe({
      next: (res) => {
        // Tag filter API uses ApiResponse structure
        this.products = res.products || res || [];
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      }
    });
  }

  onAddToCart(product: AllProductResponse) {
    this.cartService.addItem({ productId: product.id, quantity: 1 }).subscribe({
      next: () => {},
      error: () => alert('Failed to add to cart'),
    });
  }
}
