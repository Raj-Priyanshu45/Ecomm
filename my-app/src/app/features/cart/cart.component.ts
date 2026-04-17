import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CartService } from './cart.service';
import { CartResponse } from '../../models/models';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, DecimalPipe, FormsModule],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private oidc = inject(OidcSecurityService);
  private toast = inject(ToastService);

  cart: CartResponse | null = null;
  loading = true;
  message = '';

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (c) => {
        this.cart = c;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to load your cart. Please refresh the page.');
      },
    });
  }

  updateQuantity(cartItemId: number, qty: number): void {
    if (qty === 0) {
      this.removeItem(cartItemId);
      return;
    }
    this.cartService.updateItem(cartItemId, qty).subscribe({
      next: (c) => (this.cart = c),
      error: () => this.toast.error('Could not update item quantity. Please try again.'),
    });
  }

  removeItem(cartItemId: number): void {
    this.cartService.removeItem(cartItemId).subscribe({
      next: (c) => (this.cart = c),
      error: () => this.toast.error('Could not remove item from cart. Please try again.'),
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cart = null;
        this.message = 'Cart cleared.';
      },
    });
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }
}