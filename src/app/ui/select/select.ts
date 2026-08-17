import { Component, ElementRef, computed, input, model, signal, viewChild } from '@angular/core';

export type SelectOption = { value: string; label: string };

/**
 * Anchored popover, NOT a self-modal — this is the direct fix for the old
 * mobile app's root UX bug: its `Select` always opened its own full-screen
 * Modal regardless of context, which is what turned "pick one dropdown
 * value while creating an entity mid-wizard" into 3-4 stacked layers.
 */
@Component({
  selector: 'app-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Select {
  readonly options = input.required<SelectOption[]>();
  readonly label = input<string | null>(null);
  readonly placeholder = input('Elegí una opción');
  readonly disabled = input(false);

  readonly value = model<string | null>(null);

  protected readonly open = signal(false);
  protected readonly selectedOption = computed(
    () => this.options().find((o) => o.value === this.value()) ?? null,
  );

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');

  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
  }

  protected selectOption(opt: SelectOption): void {
    this.value.set(opt.value);
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.open.set(false);
      return;
    }

    if (!this.open()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.open.set(true);
      }
      return;
    }

    const opts = this.options();
    if (opts.length === 0) return;
    const currentIndex = opts.findIndex((o) => o.value === this.value());

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = opts[Math.min(opts.length - 1, currentIndex + 1)];
      this.value.set(next.value);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = opts[Math.max(0, currentIndex - 1)];
      this.value.set(prev.value);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open.set(false);
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.root().nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
