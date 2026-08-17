import { Component, model, input } from '@angular/core';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.html',
})
export class Textarea {
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly disabled = input(false);
  readonly rows = input(4);

  readonly value = model('');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
