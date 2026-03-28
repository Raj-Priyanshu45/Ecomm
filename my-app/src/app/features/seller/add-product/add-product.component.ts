import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService, CreateProductResponse } from '../services/product.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: string;
}

interface VariantEntry {
  key: string;
  value: string;
  price: number;
  quantity: number;
  images: ImagePreview[];
  primaryKey: number;
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './add-product.component.html',
})
export class AddProductComponent {
  // Step tracking (1=details, 2=images, 3=variants, 4=variant images)
  currentStep = 1;
  readonly totalSteps = 4;

  // Step 1 — Product details
  name = '';
  description = '';
  price: number | null = null;
  quantity: number | null = null;
  tagsInput = '';

  // Step 2 — Product Images (MANDATORY)
  images: ImagePreview[] = [];
  primaryIndex = 0;
  dragOver = false;

  // Step 3 — Variants
  variants: VariantEntry[] = [];
  newVariantKey = '';
  newVariantValue = '';
  newVariantPrice = 0;
  newVariantQuantity = 1;
  showVariantForm = false;

  // State
  loading = false;
  success = false;
  error = '';
  createdProductId: number | null = null;
  submittedVariantIds: number[] = [];
  stepLabels = ['Details', 'Images', 'Variants', 'Finish'];

  // Confirm Dialog State
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private router: Router
  ) {}

  // ── Dialog Handlers ─────────────────────────────────

  confirmDeleteImage(index: number) {
    this.confirmTitle = 'Remove Image';
    this.confirmMessage = 'Are you sure you want to remove this product image?';
    this.confirmAction = () => {
      URL.revokeObjectURL(this.images[index].url);
      this.images.splice(index, 1);
      if (this.primaryIndex >= this.images.length) {
        this.primaryIndex = 0;
      }
    };
    this.showConfirmDialog = true;
  }

  confirmDeleteVariant(index: number) {
    this.confirmTitle = 'Remove Variant';
    this.confirmMessage = `Are you sure you want to remove the variant "${this.variants[index].value}"?`;
    this.confirmAction = () => {
      this.variants[index].images.forEach(img => URL.revokeObjectURL(img.url));
      this.variants.splice(index, 1);
    };
    this.showConfirmDialog = true;
  }

  confirmDeleteVariantImage(variant: VariantEntry, imgIndex: number) {
    this.confirmTitle = 'Remove Variant Image';
    this.confirmMessage = 'Are you sure you want to remove this variant image?';
    this.confirmAction = () => {
      URL.revokeObjectURL(variant.images[imgIndex].url);
      variant.images.splice(imgIndex, 1);
      if (variant.primaryKey >= variant.images.length) {
        variant.primaryKey = 0;
      }
    };
    this.showConfirmDialog = true;
  }

  executeConfirm() {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  cancelConfirm() {
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

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

  // ── Step 2: Image handling (MANDATORY) ──────────────

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
      this.addFiles(Array.from(files), this.images);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files), this.images);
      input.value = '';
    }
  }

  private addFiles(files: File[], target: ImagePreview[], maxCount = 10): void {
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
      if (target.length >= maxCount) {
        this.error = `Maximum ${maxCount} images allowed.`;
        break;
      }

      target.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: this.formatSize(file.size),
      });
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

  submitImages(): void {
    if (this.images.length === 0) {
      this.error = 'At least one product image is required.';
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
          this.currentStep = 3;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.mess?.[0] || err?.error?.message || 'Failed to upload images.';
        },
      });
  }

  // ── Step 3: Variants ────────────────────────────────

  addVariant(): void {
    if (!this.newVariantKey.trim() || !this.newVariantValue.trim()) {
      this.error = 'Variant key and value are required.';
      return;
    }
    this.variants.push({
      key: this.newVariantKey.trim(),
      value: this.newVariantValue.trim(),
      price: this.newVariantPrice,
      quantity: this.newVariantQuantity,
      images: [],
      primaryKey: 0,
    });
    this.newVariantKey = '';
    this.newVariantValue = '';
    this.newVariantPrice = 0;
    this.newVariantQuantity = 1;
    this.showVariantForm = false;
    this.error = '';
  }

  onVariantFileSelect(event: Event, variant: VariantEntry): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files), variant.images, 5);
      input.value = '';
    }
  }

  submitVariantsAndFinish(): void {
    if (this.variants.length === 0) {
      this.finishProduct();
      return;
    }

    this.loading = true;
    this.error = '';
    this.submitNextVariant(0);
  }

  private submitNextVariant(index: number): void {
    if (index >= this.variants.length) {
      this.loading = false;
      this.finishProduct();
      return;
    }

    const v = this.variants[index];
    const fd = new FormData();
    fd.append('key', v.key);
    fd.append('value', v.value);
    fd.append('price', v.price.toString());
    fd.append('quantity', v.quantity.toString());
    fd.append('primaryKey', v.primaryKey.toString());
    v.images.forEach(img => fd.append('images', img.file));

    this.productService.addVariant(this.createdProductId!, fd).subscribe({
      next: () => {
        this.submitNextVariant(index + 1);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.mess?.[0] || err?.error?.message || err?.message || 'Unknown error';
        this.error = `Failed to add variant "${v.key}: ${v.value}" — ${msg}`;
      }
    });
  }

  skipVariants(): void {
    this.finishProduct();
  }

  private finishProduct(): void {
    this.success = true;
    setTimeout(() => this.router.navigate(['/seller/products']), 2000);
  }
}