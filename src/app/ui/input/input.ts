import { Component, model, input } from '@angular/core';

export type InputFieldType = 'text' | 'email' | 'password' | 'search' | 'date';

@Component({
  selector: 'app-input',
  templateUrl: './input.html',
})
export class Input {
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  readonly type = input<InputFieldType>('text');
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);

  readonly value = model('');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
