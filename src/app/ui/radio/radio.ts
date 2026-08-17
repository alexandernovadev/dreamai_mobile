import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
})
export class Radio {
  readonly label = input.required<string>();
  readonly selected = input(false);
  readonly disabled = input(false);

  readonly select = output<void>();

  protected onClick(): void {
    if (this.disabled()) return;
    this.select.emit();
  }
}
