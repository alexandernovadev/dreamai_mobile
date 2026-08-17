import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
})
export class Switch {
  readonly label = input<string | null>(null);
  readonly disabled = input(false);

  readonly checked = model(false);

  protected toggle(): void {
    if (this.disabled()) return;
    this.checked.update((v) => !v);
  }
}
