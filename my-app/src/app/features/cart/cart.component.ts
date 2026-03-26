import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CartService } from '../../services/cart.service';
import { CartResponse } from '../../models/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, DecimalPipe, FormsModule],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private oidc = inject(OidcSecurityService);

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
      error: () => (this.loading = false),
    });
  }

  updateQuantity(cartItemId: number, qty: number): void {
    if (qty === 0) {
      this.removeItem(cartItemId);
      return;
    }
    this.cartService.updateItem(cartItemId, qty).subscribe({
      next: (c) => (this.cart = c),
    });
  }

  removeItem(cartItemId: number): void {
    this.cartService.removeItem(cartItemId).subscribe({
      next: (c) => (this.cart = c),
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
}