import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
           (click)="onCancel()"></div>

      <!-- Dialog Panel -->
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-[slide-down_0.3s_ease-out] border border-slate-100 p-6 sm:p-8">
        
        <!-- Icon -->
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 mb-6">
          <svg class="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <!-- Content -->
        <div class="text-center">
          <h3 class="text-xl font-black text-slate-900 mb-2" id="modal-title">
            {{ title }}
          </h3>
          <div class="mt-2">
            <p class="text-sm font-medium text-slate-500">
              {{ message }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <button type="button" 
                  class="w-full inline-flex justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-200 transition-colors active:scale-95 sm:w-auto sm:flex-1"
                  (click)="onCancel()">
            Cancel
          </button>
          <button type="button" 
                  class="w-full inline-flex justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 transition-colors active:scale-95 sm:w-auto sm:flex-1"
                  (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isOpen = false;
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }
}
