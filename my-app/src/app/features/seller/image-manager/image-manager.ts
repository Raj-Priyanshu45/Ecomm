import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';

interface ImageDTO {
  id: number;
  url: string;
  isPrimary: boolean;
}

@Component({
  selector: 'app-image-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './image-manager.html',
  styleUrl: './image-manager.css',
})
export class ImageManager implements OnInit {
  productId!: number;
  
  images: ImageDTO[] = [];
  primaryImageUrl: string = 'Not Assigned';
  imageCount: number = 0;

  loading = true;
  actionLoading = false;
  successMsg = '';
  errorMsg = '';

  newFiles: File[] = [];
  newPrimaryIndex: number = 0;

  isDragOver = false;
  replacingImageId: number | null = null;
  
  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadImages();
  }

  loadImages() {
    this.loading = true;
    this.productService.getProductImageInfo(this.productId).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.images = data.imageList || [];
        this.imageCount = data.imageCount || 0;
        this.primaryImageUrl = data.primary || 'Not Assigned';
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load images.';
        this.loading = false;
      }
    });
  }

  onFileSelect(event: any) {
    if (event.target.files) {
      this.newFiles = Array.from(event.target.files);
      if (this.newPrimaryIndex >= this.newFiles.length) {
        this.newPrimaryIndex = 0;
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.newFiles = Array.from(event.dataTransfer.files);
      if (this.newPrimaryIndex >= this.newFiles.length) {
        this.newPrimaryIndex = 0;
      }
    }
  }

  uploadNewImages() {
    if (!this.newFiles.length) return;
    this.actionLoading = true;
    this.errorMsg = '';
    
    this.productService.uploadImages(this.productId, this.newFiles, this.newPrimaryIndex).subscribe({
      next: () => {
        this.successMsg = 'Images uploaded successfully!';
        this.newFiles = [];
        this.loadImages();
        this.actionLoading = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.mess?.[0] || 'Upload failed';
        this.actionLoading = false;
      }
    });
  }

  deleteImage(imageId: number) {
    if(!confirm('Are you sure you want to delete this image?')) return;
    this.actionLoading = true;
    
    this.productService.deleteImage(this.productId, imageId).subscribe({
      next: () => {
        this.successMsg = 'Image deleted!';
        this.loadImages();
        this.actionLoading = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.mess?.[0] || 'Failed to delete';
        this.actionLoading = false;
      }
    });
  }

  deleteAllImages() {
    if(!confirm('DANGER! Are you sure you want to delete ALL images?')) return;
    this.actionLoading = true;
    
    this.productService.deleteAllImages(this.productId).subscribe({
      next: () => {
        this.successMsg = 'All images deleted!';
        this.images = [];
        this.imageCount = 0;
        this.primaryImageUrl = 'Not Assigned';
        this.actionLoading = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = 'Failed to delete all images';
        this.actionLoading = false;
      }
    });
  }

  triggerReplace(imageId: number) {
    this.replacingImageId = imageId;
    document.getElementById('replaceInput')?.click();
  }

  onReplaceFileSelect(event: any) {
    if (!this.replacingImageId || !event.target.files?.length) return;
    const file = event.target.files[0];
    
    this.actionLoading = true;
    this.productService.replaceImage(this.productId, this.replacingImageId, file).subscribe({
      next: () => {
        this.successMsg = 'Image replaced successfully!';
        this.loadImages();
        this.actionLoading = false;
        this.replacingImageId = null;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = 'Failed to replace image';
        this.actionLoading = false;
        this.replacingImageId = null;
      }
    });
  }

  setAsPrimary(imageId: number) {
    const currentPrimary = this.images.find(i => i.isPrimary);
    if (!currentPrimary) return; // shouldn't happen usually
    
    if (currentPrimary.id === imageId) {
      this.successMsg = 'This is already the primary image';
      setTimeout(() => this.successMsg = '', 2000);
      return;
    }

    this.actionLoading = true;
    this.productService.swapPrimaryImage(this.productId, currentPrimary.id, imageId).subscribe({
      next: () => {
        this.successMsg = 'Primary image updated!';
        this.loadImages();
        this.actionLoading = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = 'Failed to update primary image';
        this.actionLoading = false;
      }
    });
  }
}
