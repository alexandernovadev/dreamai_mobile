import { Component, computed, input, output } from '@angular/core';
import type { EntityKind } from '../entity-kind';

function initialsOf(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

@Component({
  selector: 'app-entity-card',
  templateUrl: './entity-card.html',
  styleUrl: './entity-card.scss',
})
export class EntityCard {
  readonly entityType = input.required<EntityKind>();
  readonly title = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly appearanceCount = input<number | null>(null);

  readonly select = output<void>();

  protected readonly toneClass = computed(() => `entity-card--${this.entityType()}`);
  protected readonly initials = computed(() => initialsOf(this.title()));
}
