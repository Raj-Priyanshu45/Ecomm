import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { RouterModule } from '@angular/router';

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
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
      }
    });
  }

  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to delete product', err);
        }
      });
    }
  }
}

