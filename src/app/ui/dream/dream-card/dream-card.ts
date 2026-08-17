import { Component, input, output } from '@angular/core';
import { StatusBadge, type DreamStatus } from '../../status-badge/status-badge';

@Component({
  selector: 'app-dream-card',
  imports: [StatusBadge],
  templateUrl: './dream-card.html',
  styleUrl: './dream-card.scss',
})
export class DreamCard {
  readonly date = input.required<string>();
  readonly status = input.required<DreamStatus>();
  readonly snippet = input.required<string>();
  readonly coverUrl = input<string | null>(null);

  readonly view = output<void>();
  readonly edit = output<void>();

  protected onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.edit.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Space also scrolls the page by default — stop that when it activates the card.
    event.preventDefault();
    this.view.emit();
  }
}
