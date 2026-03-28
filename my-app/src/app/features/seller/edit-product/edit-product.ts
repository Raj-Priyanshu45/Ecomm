import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService as SellerProductService } from '../services/product.service';
import { ProductService as PublicProductService } from '../../../services/product.service';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css',
})
export class EditProduct implements OnInit {
  productId!: number;

  name = '';
  description = '';
  price: number | null = null;
  quantity: number | null = null;
  tagsInput = '';

  loading = true;
  saving = false;
  success = false;
  error = '';

  constructor(
    private sellerProductService: SellerProductService,
    private publicProductService: PublicProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct();
  }

  loadProduct() {
    this.publicProductService.getProductDetail(this.productId).subscribe({
      next: (res) => {
        this.name = res.name;
        this.description = res.description;
        this.price = res.price;
        this.quantity = res.count;
        this.tagsInput = res.tags ? res.tags.map((t: any) => t.name).join(', ') : '';
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load product details.';
        this.loading = false;
      }
    });
  }

  submitDetails(): void {
    if (!this.name.trim() || !this.description.trim() || this.price == null || this.price <= 0 || this.quantity == null || this.quantity < 1) {
      this.error = 'Please fill all required fields correctly (price/quantity must be > 0).';
      return;
    }

    this.saving = true;
    this.error = '';

    const tags = this.tagsInput
      ? this.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length)
      : [];

    this.sellerProductService
      .updateProduct(this.productId, {
        name: this.name,
        description: this.description,
        price: this.price,
        quantity: this.quantity,
        tags,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.success = true;
          setTimeout(() => this.router.navigate(['/seller/products']), 1500);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.mess?.[0] || err?.error?.message || 'Failed to update product.';
        },
      });
  }
}

