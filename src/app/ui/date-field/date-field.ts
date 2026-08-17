import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-date-field',
  templateUrl: './date-field.html',
})
export class DateField {
  readonly label = input<string | null>(null);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);

  /** ISO date string, `YYYY-MM-DD` — matches `<input type="date">` natively. */
  readonly value = model('');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
