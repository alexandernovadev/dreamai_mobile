import { Component, computed, input } from '@angular/core';

export type LucidityBin = { level: number; count: number };

@Component({
  selector: 'app-lucidity-histogram',
  templateUrl: './lucidity-histogram.html',
  styleUrl: './lucidity-histogram.scss',
})
export class LucidityHistogram {
  readonly bins = input.required<LucidityBin[]>();

  protected readonly max = computed(() =>
    Math.max(1, ...this.bins().map((b) => b.count)),
  );
  protected readonly hasAny = computed(() => this.bins().some((b) => b.count > 0));

  protected heightOf(count: number): number {
    return Math.max(6, Math.round((count / this.max()) * 96));
  }
}
