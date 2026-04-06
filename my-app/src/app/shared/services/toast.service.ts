import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 4000): void {
    this.add(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.add(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.add(message, 'info', duration);
  }

  warning(message: string, duration = 4500): void {
    this.add(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
