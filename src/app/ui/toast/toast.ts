import { Component, effect, input, output } from '@angular/core';

export type ToastTone = 'success' | 'danger' | 'info';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  readonly message = input.required<string>();
  readonly tone = input<ToastTone>('success');
  /** Auto-dismiss after N ms. Leave unset (`null`) to require manual dismissal. */
  readonly autoDismissMs = input<number | null>(4000);

  readonly dismiss = output<void>();

  constructor() {
    effect((onCleanup) => {
      const ms = this.autoDismissMs();
      // Re-reading message() re-arms the timer whenever a new toast message
      // comes in through the same component instance.
      this.message();
      if (ms === null) return;
      const timer = setTimeout(() => this.dismiss.emit(), ms);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
