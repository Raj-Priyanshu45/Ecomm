import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { AllProductResponse } from '../../../models/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [DecimalPipe, NgClass, StarRatingComponent],
  template: `
    <div
      (click)="goToDetail()"
      class="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200">

      <!-- Image -->
      <div class="relative aspect-square bg-gray-50 overflow-hidden">
        @if (product.imageUrl) {
          <img
            [src]="imageBase + product.imageUrl"
            [alt]="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            (error)="handleImgError($event)"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-300">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        }
        <!-- In stock badge -->
        <span
          [ngClass]="product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
          class="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium">
          {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
        </span>
      </div>

      <!-- Info -->
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 truncate text-sm">{{ product.name }}</h3>
        <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ product.shortDesc }}</p>

        <div class="mt-2">
          <app-star-rating [rating]="product.rating" [count]="product.reviewCount"/>
        </div>

        <div class="flex items-center justify-between mt-3">
          <span class="text-lg font-bold text-gray-900">
            ₹{{ product.price | number:'1.0-0' }}
          </span>
          <button
            (click)="onAddToCart($event)"
            [disabled]="!product.inStock"
            class="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Add to Cart
          </button>
        </div>

        <!-- Tags -->
        @if (product.tags?.length) {
          <div class="flex flex-wrap gap-1 mt-2">
            @for (tag of product.tags.slice(0, 3); track tag.id) {
              <span class="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                {{ tag.name }}
              </span>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: AllProductResponse;
  @Output() addToCart = new EventEmitter<AllProductResponse>();

  private router = inject(Router);
  imageBase = 'http://localhost:8080';

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id]);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  handleImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '';
  }
}