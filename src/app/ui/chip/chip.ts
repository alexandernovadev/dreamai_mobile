import { Component, computed, input, output } from '@angular/core';
import type { EntityKind } from '../dream/entity-kind';

export type ChipTone = 'neutral' | EntityKind;

@Component({
  selector: 'app-chip',
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
})
export class Chip {
  readonly tone = input<ChipTone>('neutral');
  readonly selected = input(false);
  readonly removable = input(false);

  readonly remove = output<void>();

  protected readonly toneClass = computed(() => `chip--${this.tone()}`);
}
