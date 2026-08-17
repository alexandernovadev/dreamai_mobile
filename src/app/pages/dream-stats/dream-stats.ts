import { Component, computed, inject, signal } from '@angular/core';
import { DreamSessionHttpService } from '../../core/http/dream-session-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { AsyncState } from '../../ui/async-state/async-state';
import { LucidityHistogram } from '../../ui/dream/lucidity-histogram/lucidity-histogram';
import { TopEntityList } from '../../ui/dream/top-entity-list/top-entity-list';
import type { DreamAnalyticsOverview } from '../../core/models/dream-session.model';

type CatalogTotalRow = { label: string; count: number };

/** `/more/stats` — lifetime stats: dream count, catalog totals, lucidity
 * histogram, top recurring characters/locations/objects. Single
 * `GET /dream-sessions/analytics/overview` call. */
@Component({
  selector: 'app-dream-stats',
  imports: [AsyncState, LucidityHistogram, TopEntityList],
  templateUrl: './dream-stats.html',
  styleUrl: './dream-stats.scss',
})
export class DreamStats {
  private readonly dreamSessionHttp = inject(DreamSessionHttpService);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly overview = signal<DreamAnalyticsOverview | null>(null);

  protected readonly catalogRows = computed<CatalogTotalRow[]>(() => {
    const totals = this.overview()?.catalogTotals;
    if (!totals) return [];
    return [
      { label: 'Personajes', count: totals.characters },
      { label: 'Lugares', count: totals.locations },
      { label: 'Objetos', count: totals.objects },
      { label: 'Eventos', count: totals.events },
      { label: 'Contexto de vida', count: totals.contextLife },
      { label: 'Sentimientos', count: totals.feelings },
    ];
  });

  constructor() {
    this.pageHeader.set('Estadísticas', 'Toda tu historia onírica', true);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dreamSessionHttp.analyticsOverview().subscribe({
      next: (res) => {
        this.overview.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas.');
        this.loading.set(false);
      },
    });
  }
}
