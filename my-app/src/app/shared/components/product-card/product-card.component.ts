import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AllProductResponse } from '../../../models/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [DecimalPipe, StarRatingComponent],
  template: `
    <div
      (click)="goToDetail()"
      class="group glass-card rounded-2xl overflow-hidden cursor-pointer card-hover relative">

      <!-- ── Image ── -->
      <div class="relative aspect-square overflow-hidden bg-slate-800/50">
        @if (product.imageUrl) {
          <img
            [src]="getImageUrl(product.imageUrl)"
            [alt]="product.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            (error)="handleImgError($event)"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        }

        <!-- Hover dark overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <!-- Quick Add slides up on hover -->
        <div class="absolute bottom-0 inset-x-0 p-3
                    translate-y-full group-hover:translate-y-0
                    transition-transform duration-300 ease-out">
          <button (click)="onAddToCart($event)" [disabled]="!product.inStock"
                  class="w-full py-2 px-3 rounded-xl text-xs font-bold text-white
                         bg-gradient-to-r from-indigo-600 to-violet-600
                         hover:from-indigo-500 hover:to-violet-500
                         shadow-lg shadow-indigo-500/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all active:scale-95">
            {{ product.inStock ? '+ Add to Cart' : 'Out of Stock' }}
          </button>
        </div>

        <!-- Stock badge -->
        <span class="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
              [class]="product.inStock
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'">
          {{ product.inStock ? 'In Stock' : 'Sold Out' }}
        </span>

        <!-- Discount badge -->
        @if (product.discount && product.discount > 0) {
          <span class="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full
                       bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30">
            -{{ product.discount }}%
          </span>
        }
      </div>

      <!-- ── Info ── -->
      <div class="p-3.5">
        <h3 class="font-semibold text-slate-200 text-sm truncate leading-snug">{{ product.name }}</h3>
        <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{{ product.shortDesc }}</p>

        <div class="mt-1.5">
          <app-star-rating [rating]="product.rating" [count]="product.reviewCount"/>
        </div>

        <!-- Price row -->
        <div class="flex items-center justify-between mt-2.5">
          <div class="flex flex-col">
            @if (product.discount && product.discount > 0) {
              <span class="text-xs text-slate-600 line-through leading-none">
                ₹{{ product.price | number:'1.0-0' }}
              </span>
              <span class="text-base font-black gradient-text leading-tight">
                ₹{{ (product.price * (1 - product.discount / 100)) | number:'1.0-0' }}
              </span>
            } @else {
              <span class="text-base font-black text-slate-100">₹{{ product.price | number:'1.0-0' }}</span>
            }
          </div>

          <!-- Small add btn visible on mobile (hover overlay doesn't work on touch) -->
          <button (click)="onAddToCart($event)" [disabled]="!product.inStock"
                  class="md:hidden w-8 h-8 rounded-lg flex items-center justify-center
                         bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20
                         text-indigo-400 hover:text-indigo-300
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-90">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- Tags -->
        @if (product.tags.length) {
          <div class="flex flex-wrap gap-1 mt-2.5">
            @for (tag of product.tags.slice(0, 2); track tag.id) {
              <button (click)="goToTag($event, tag.name)"
                      class="text-[10px] px-2 py-0.5 rounded-full
                             bg-slate-800 hover:bg-indigo-500/10
                             text-slate-500 hover:text-indigo-400
                             border border-slate-700/50 hover:border-indigo-500/30
                             transition-all duration-200">
                {{ tag.name }}
              </button>
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
  private localBase = environment.apiUrl;

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : this.localBase + url;
  }

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id]);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  goToTag(event: Event, tag: string): void {
    event.stopPropagation();
    this.router.navigate(['/products/tag', tag.toLowerCase()]);
  }

  handleImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '';
  }
}