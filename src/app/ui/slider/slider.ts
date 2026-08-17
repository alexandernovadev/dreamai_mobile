import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
})
export class Slider {
  readonly label = input<string | null>(null);
  readonly min = input(0);
  readonly max = input(10);
  readonly step = input(1);
  readonly disabled = input(false);

  readonly value = model(0);

  protected onInput(event: Event): void {
    this.value.set(Number((event.target as HTMLInputElement).value));
  }
}
