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
          role="alert">

          <!-- Colored left bar -->
          <div class="toast-bar" [ngClass]="'bar-' + toast.type"></div>

          <!-- Icon -->
          <span class="toast-icon" [ngClass]="'icon-' + toast.type">
            @switch (toast.type) {
              @case ('success') {
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('warning') {
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
              @default {
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </span>

          <!-- Message -->
          <span class="toast-message">{{ toast.message }}</span>

          <!-- Dismiss -->
          <button class="toast-dismiss" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      max-width: min(400px, calc(100vw - 3rem));
      pointer-events: none;
    }

    .toast-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem 0.875rem 0.5rem;
      border-radius: 0.875rem;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
      pointer-events: all;
      animation: toastSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      overflow: hidden;
    }

    @keyframes toastSlide {
      from { opacity: 0; transform: translateX(110%) scale(0.9); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    .toast-bar {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      border-radius: 4px 0 0 4px;
    }

    .toast-success .toast-bar, .bar-success { background: #4ade80; }
    .toast-error   .toast-bar, .bar-error   { background: #f87171; }
    .toast-warning .toast-bar, .bar-warning { background: #fbbf24; }
    .toast-info    .toast-bar, .bar-info    { background: #60a5fa; }

    .toast-icon {
      flex-shrink: 0;
      margin-left: 0.5rem;
      display: flex;
    }

    .icon-success { color: #4ade80; }
    .icon-error   { color: #f87171; }
    .icon-warning { color: #fbbf24; }
    .icon-info    { color: #60a5fa; }

    .toast-message {
      flex: 1;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #e2e8f0;
      line-height: 1.45;
    }

    .toast-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: #475569;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      border-radius: 0.375rem;
      transition: color 0.15s, background 0.15s;
    }
    .toast-dismiss:hover {
      color: #94a3b8;
      background: rgba(255,255,255,0.06);
    }

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
