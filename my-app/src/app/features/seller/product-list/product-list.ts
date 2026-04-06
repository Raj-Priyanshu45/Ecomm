import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: any[] = [];
  loading = true;
  private toast = inject(ToastService);

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getSellerProducts().subscribe({
      next: (res: any) => {
        this.products = res.products || res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to load your products. Please refresh the page.');
      }
    });
  }

  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toast.success('Product deleted successfully.');
          this.loadProducts();
        },
        error: () => {
          this.toast.error('Could not delete this product. Please try again.');
        }
      });
    }
  }
}

