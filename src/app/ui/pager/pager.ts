import {
  Component,
  computed,
  contentChild,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type PagerItemContext<T> = { $implicit: T; index: number };

/**
 * Full-bleed, one-item-at-a-time pager — the "hojear el diario" pattern from
 * dreamai_app's BookDream screen, generalized so it isn't tied to dream data.
 *
 * Usage:
 * ```html
 * <app-pager [items]="dreams">
 *   <ng-template #pagerItem let-dream>
 *     ...render one dream...
 *   </ng-template>
 * </app-pager>
 * ```
 */
@Component({
  selector: 'app-pager',
  imports: [NgTemplateOutlet],
  templateUrl: './pager.html',
  styleUrl: './pager.scss',
})
export class Pager<T> {
  readonly items = input.required<T[]>();

  readonly itemTemplate =
    contentChild.required<TemplateRef<PagerItemContext<T>>>('pagerItem');

  protected readonly index = signal(0);
  protected readonly total = computed(() => this.items().length);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() >= this.total() - 1);

  protected templateContext(item: T, i: number): PagerItemContext<T> {
    return { $implicit: item, index: i };
  }

  protected goPrev(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  protected goNext(): void {
    this.index.update((i) => Math.min(this.total() - 1, i + 1));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goNext();
    }
  }
}
