import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-item"
          [ngClass]="'toast-' + toast.type"
          role="alert"
        >
          <!-- Icon -->
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
              @default {
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </span>

          <!-- Message -->
          <span class="toast-message">{{ toast.message }}</span>

          <!-- Dismiss button -->
          <button class="toast-dismiss" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-width: min(420px, calc(100vw - 3rem));
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 0.875rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      pointer-events: all;
      animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      backdrop-filter: blur(8px);
      border: 1px solid transparent;
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%) scale(0.92); }
      to   { opacity: 1; transform: translateX(0)   scale(1); }
    }

    .toast-success {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-color: #86efac;
      color: #14532d;
    }
    .toast-success .toast-icon { color: #16a34a; }

    .toast-error {
      background: linear-gradient(135deg, #fff1f2, #ffe4e6);
      border-color: #fca5a5;
      color: #7f1d1d;
    }
    .toast-error .toast-icon { color: #dc2626; }

    .toast-warning {
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border-color: #fcd34d;
      color: #78350f;
    }
    .toast-warning .toast-icon { color: #d97706; }

    .toast-info {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-color: #93c5fd;
      color: #1e3a5f;
    }
    .toast-info .toast-icon { color: #2563eb; }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 0.05rem;
    }

    .toast-message {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.45;
    }

    .toast-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
      padding: 0;
      display: flex;
      align-items: center;
      transition: opacity 0.15s;
      color: inherit;
    }
    .toast-dismiss:hover { opacity: 1; }

    @media (max-width: 640px) {
      .toast-container {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
