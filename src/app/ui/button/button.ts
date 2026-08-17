import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled() || this.loading()) return;
    this.pressed.emit();
  }
}
