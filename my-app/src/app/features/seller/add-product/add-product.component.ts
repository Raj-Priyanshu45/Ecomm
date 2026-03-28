import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, CreateProductResponse } from '../services/product.service';

interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: string;
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
})
export class AddProductComponent {
  // Step tracking
  currentStep = 1;

  // Step 1 — Product details
  name = '';
  description = '';
  price: number | null = null;
  quantity: number | null = null;
  tagsInput = '';

  // Step 2 — Images
  images: ImagePreview[] = [];
  primaryIndex = 0;
  dragOver = false;

  // State
  loading = false;
  success = false;
  error = '';
  createdProductId: number | null = null;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  // ── Step 1: Create product ──────────────────────────

  submitDetails(): void {
    if (!this.name.trim() || !this.description.trim() || this.price == null || this.price <= 0 || this.quantity == null || this.quantity < 1) {
      this.error = 'Please fill all required fields correctly (price/quantity must be > 0).';
      return;
    }

    this.loading = true;
    this.error = '';

    const tags = this.tagsInput
      ? this.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length)
      : [];

    this.productService
      .createProduct({
        name: this.name,
        description: this.description,
        price: this.price,
        quantity: this.quantity,
        tags,
      })
      .subscribe({
        next: (res: CreateProductResponse) => {
          this.createdProductId = res.productId;
          this.loading = false;
          this.currentStep = 2;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.mess?.[0] || err?.error?.message || 'Failed to create product.';
        },
      });
  }

  // ── Step 2: Image handling ──────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private addFiles(files: File[]): void {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        this.error = `"${file.name}" is not a supported image format.`;
        continue;
      }
      if (file.size > maxSize) {
        this.error = `"${file.name}" exceeds 5 MB limit.`;
        continue;
      }
      if (this.images.length >= 10) {
        this.error = 'Maximum 10 images allowed.';
        break;
      }

      this.images.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: this.formatSize(file.size),
      });
    }
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.images[index].url);
    this.images.splice(index, 1);
    if (this.primaryIndex >= this.images.length) {
      this.primaryIndex = 0;
    }
  }

  setPrimary(index: number): void {
    this.primaryIndex = index;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── Submit images ───────────────────────────────────

  submitImages(): void {
    if (this.images.length === 0) {
      this.error = 'Please add at least one image.';
      return;
    }
    if (!this.createdProductId) {
      this.error = 'Product ID missing. Please go back and retry.';
      return;
    }

    this.loading = true;
    this.error = '';

    const files = this.images.map((img) => img.file);

    this.productService
      .uploadImages(this.createdProductId, files, this.primaryIndex)
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => this.router.navigate(['/']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.mess?.[0] || err?.error?.message || 'Failed to upload images.';
        },
      });
  }

  // ── Skip images ─────────────────────────────────────

  skipImages(): void {
    this.router.navigate(['/']);
  }
}