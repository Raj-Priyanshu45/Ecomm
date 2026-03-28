import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './variant-manager.html',
  styleUrl: './variant-manager.css',
})
export class VariantManager implements OnInit {
  productId = 0;
  variants: any[] = [];
  loading = true;
  showAddForm = false;

  // Add form fields
  newKey = '';
  newValue = '';
  newPrice = 0;
  newQuantity = 1;
  newImages: File[] = [];
  newPrimaryKey = 0;
  submitting = false;

  // Inline editing
  editingPriceId: number | null = null;
  editingStockId: number | null = null;
  editPrice = 0;
  editStock = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.productId = +this.route.snapshot.paramMap.get('productId')!;
    this.loadVariants();
  }

  loadVariants() {
    this.loading = true;
    this.productService.getProductVariants(this.productId).subscribe({
      next: (res) => {
        this.variants = res || [];
        this.loading = false;
      },
      error: () => {
        this.variants = [];
        this.loading = false;
      }
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.newImages = Array.from(input.files);
    }
  }

  addVariant() {
    if (!this.newKey || !this.newValue) return;
    this.submitting = true;
    const fd = new FormData();
    fd.append('key', this.newKey);
    fd.append('value', this.newValue);
    fd.append('price', this.newPrice.toString());
    fd.append('quantity', this.newQuantity.toString());
    fd.append('primaryKey', this.newPrimaryKey.toString());
    this.newImages.forEach(f => fd.append('images', f));

    this.productService.addVariant(this.productId, fd).subscribe({
      next: () => {
        this.submitting = false;
        this.showAddForm = false;
        this.resetForm();
        this.loadVariants();
      },
      error: (err) => {
        this.submitting = false;
        alert('Failed to add variant: ' + (err.error?.message || err.message));
      }
    });
  }

  resetForm() {
    this.newKey = '';
    this.newValue = '';
    this.newPrice = 0;
    this.newQuantity = 1;
    this.newImages = [];
    this.newPrimaryKey = 0;
  }

  startEditPrice(v: any) {
    this.editingPriceId = v.id;
    this.editPrice = v.price;
  }

  savePrice(v: any) {
    this.productService.updateVariantPrice(this.productId, v.id, this.editPrice).subscribe({
      next: () => { this.editingPriceId = null; v.price = this.editPrice; },
      error: () => alert('Failed to update price')
    });
  }

  startEditStock(v: any) {
    this.editingStockId = v.id;
    this.editStock = v.quantity;
  }

  saveStock(v: any) {
    this.productService.updateVariantStock(this.productId, v.id, this.editStock).subscribe({
      next: () => { this.editingStockId = null; v.quantity = this.editStock; },
      error: () => alert('Failed to update stock')
    });
  }

  deleteVariant(v: any) {
    if (!confirm(`Delete variant "${v.key}: ${v.value}"?`)) return;
    this.productService.deleteVariant(this.productId, v.id).subscribe({
      next: () => this.loadVariants(),
      error: () => alert('Failed to delete variant')
    });
  }
}
