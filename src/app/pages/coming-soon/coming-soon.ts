import { Component, effect, inject, input } from '@angular/core';
import { PageHeaderService } from '../../core/services/page-header.service';

/** Shared stub for routes that exist in the nav/IA but aren't built yet
 * (mirrors dreamai_app's own "coming soon" placeholders for these same three
 * screens) — one component instead of three near-identical files. */
@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
})
export class ComingSoon {
  readonly title = input('Próximamente');

  private readonly pageHeader = inject(PageHeaderService);

  constructor() {
    effect(() => this.pageHeader.set(this.title(), 'Más', true, ['/more']));
  }
}
