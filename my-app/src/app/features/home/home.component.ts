import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AllProductResponse, ApiResponse } from '../../models/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FormsModule, ProductCardComponent, NgClass],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private oidc = inject(OidcSecurityService);

  products: AllProductResponse[] = [];
  isAuthenticated = false;
  loading = true;
  searchQuery = '';
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  cartMessage = '';
  cartMessageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.oidc.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
    });
    this.loadProducts();
  }

  loadProducts(page = 0): void {
    this.loading = true;
    this.productService.getProducts(page).subscribe({
      next: (res) => {
        this.products = res.products;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadProducts();
      return;
    }
    this.loading = true;
    this.productService.searchProducts(this.searchQuery).subscribe({
      next: (res) => {
        this.products = res.products;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onAddToCart(product: AllProductResponse): void {
    if (!this.isAuthenticated) {
      this.oidc.authorize();
      return;
    }
    this.cartService
      .addItem({ productId: product.id, quantity: 1 })
      .subscribe({
        next: () => {
          this.showCartMessage(`"${product.name}" added to cart!`, 'success');
        },
        error: () => {
          this.showCartMessage('Could not add item to cart.', 'error');
        },
      });
  }

  private showCartMessage(msg: string, type: 'success' | 'error'): void {
    this.cartMessage = msg;
    this.cartMessageType = type;
    setTimeout(() => (this.cartMessage = ''), 3000);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadProducts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}