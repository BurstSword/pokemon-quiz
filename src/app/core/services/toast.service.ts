import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'danger';

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastState | null>(null);
  private timeoutId?: ReturnType<typeof setTimeout>;

  show(message: string, tone: ToastTone, duration = 1200): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.toast.set({
      id: Date.now(),
      message,
      tone,
    });

    this.timeoutId = setTimeout(() => {
      this.toast.set(null);
    }, duration);
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    this.toast.set(null);
  }
}
