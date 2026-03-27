import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent {

  name = '';
  description = '';
  price: number | null = null;
  tagsInput = '';

  loading = false;
  success = false;
  error = '';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  submit() {
    if (!this.name || !this.description || this.price == null) {
      this.error = 'All required fields must be filled';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const tags = this.tagsInput
      ? this.tagsInput.split(',').map(t => t.trim()).filter(t => t.length)
      : [];

    this.productService.createProduct({
      name: this.name,
      description: this.description,
      price: this.price,
      tags
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create product';
      }
    });
  }
}