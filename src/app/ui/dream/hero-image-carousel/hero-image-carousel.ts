import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-hero-image-carousel',
  templateUrl: './hero-image-carousel.html',
  styleUrl: './hero-image-carousel.scss',
})
export class HeroImageCarousel {
  readonly images = input.required<string[]>();

  protected readonly index = signal(0);
  protected readonly hasMultiple = computed(() => this.images().length > 1);

  protected goPrev(): void {
    const len = this.images().length;
    this.index.update((i) => (i - 1 + len) % len);
  }

  protected goNext(): void {
    const len = this.images().length;
    this.index.update((i) => (i + 1) % len);
  }

  protected goTo(i: number): void {
    this.index.set(i);
  }
}
