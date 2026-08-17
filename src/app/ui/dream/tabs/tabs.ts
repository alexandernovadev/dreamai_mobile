import { Component, ElementRef, input, model, viewChildren } from '@angular/core';

export type TabItem = {
  id: string;
  label: string;
  locked?: boolean;
};

/** ARIA APG tablist keyboard pattern: arrow keys move + activate, locked tabs are skipped. */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly tabs = input.required<TabItem[]>();
  readonly active = model<string>('');

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const items = this.tabs();
    const isArrow = event.key === 'ArrowRight' || event.key === 'ArrowLeft';
    const isEdge = event.key === 'Home' || event.key === 'End';
    if (!isArrow && !isEdge) return;
    event.preventDefault();

    let next = index;
    if (event.key === 'Home') {
      next = items.findIndex((t) => !t.locked);
    } else if (event.key === 'End') {
      next = items.length - 1 - [...items].reverse().findIndex((t) => !t.locked);
    } else {
      const dir = event.key === 'ArrowRight' ? 1 : -1;
      for (let step = 0; step < items.length; step++) {
        const candidate = (next + dir + items.length) % items.length;
        next = candidate;
        if (!items[candidate].locked) break;
      }
    }

    if (next < 0 || items[next]?.locked) return;
    this.active.set(items[next].id);
    this.buttons()[next]?.nativeElement.focus();
  }
}
