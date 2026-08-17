import { Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/button/button';
import { AsyncState } from '../../ui/async-state/async-state';
import { DreamView } from '../../ui/dream/dream-view/dream-view';
import { DreamSessionHttpService } from '../../core/http/dream-session-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import type { HydratedDreamSessionResponse } from '../../core/models/dream-session.model';

/** `/dreams/:id` — single-detail read chrome, one hydrated fetch. */
@Component({
  selector: 'app-dream-view-page',
  imports: [Button, AsyncState, DreamView],
  templateUrl: './dream-view-page.html',
  styleUrl: './dream-view-page.scss',
})
export class DreamViewPage {
  readonly id = input.required<string>();

  private readonly dreamSessionHttp = inject(DreamSessionHttpService);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly data = signal<HydratedDreamSessionResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    this.pageHeader.set('Sueño', 'Diario onírico', true);
    // `id` (required input) isn't guaranteed set inside the constructor body
    // itself — effect() runs after Angular applies inputs, unlike reading
    // them directly here.
    effect(() => this.load());
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dreamSessionHttp.getHydrated(this.id()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el sueño.');
        this.loading.set(false);
      },
    });
  }

  protected goEdit(): void {
    this.router.navigate(['/dreams', this.id(), 'edit']);
  }

  protected deleteDream(): void {
    if (this.deleting()) return;
    if (!confirm('¿Eliminar este sueño? Esta acción no se puede deshacer.')) return;
    this.deleting.set(true);
    this.dreamSessionHttp.remove(this.id()).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.deleting.set(false);
        this.error.set('No se pudo eliminar el sueño.');
      },
    });
  }
}
