import { Component, effect, inject, signal, input } from '@angular/core';
import { Router } from '@angular/router';
import { SignalsHttpService } from '../../core/http/signals-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { FEELING_TITLE_EN_TO_LABEL } from '../../core/models/catalog.model';
import { AsyncState } from '../../ui/async-state/async-state';
import { EntityCard } from '../../ui/dream/entity-card/entity-card';
import { ENTITY_LABEL, type EntityKind } from '../../ui/dream/entity-kind';

type Row = { id: string; title: string; imageUrl: string | null; appearanceCount: number };

const PAGE_LIMIT = 24;

/** `/signals/:kind` — real server-side pagination via `GET /signals/catalog/:kind`
 * (previously a fixed `limit: 60` single call through the generic catalog
 * service, capped and appearance-count-less). "Cargar más" appends pages. */
@Component({
  selector: 'app-signals-list',
  imports: [AsyncState, EntityCard],
  templateUrl: './signals-list.html',
  styleUrl: './signals-list.scss',
})
export class SignalsList {
  // Bound from the `:kind` route param via withComponentInputBinding().
  readonly kind = input.required<EntityKind>();

  private readonly signalsHttp = inject(SignalsHttpService);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly rows = signal<Row[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly hasMore = signal(false);

  constructor() {
    // `kind` (required input) isn't guaranteed set inside the constructor
    // body itself — effect() runs after Angular applies inputs.
    effect(() => {
      const kind = this.kind();
      this.pageHeader.set(ENTITY_LABEL[kind], 'Catálogo', true, ['/signals']);
      this.load(kind);
    });
  }

  protected load(kind: EntityKind = this.kind()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(1);
    this.signalsHttp.getCatalogPage(kind, 1, PAGE_LIMIT).subscribe({
      next: (res) => {
        this.rows.set(res.data.map((item) => this.toRow(kind, item)));
        this.hasMore.set(res.meta.page < res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo.');
        this.loading.set(false);
      },
    });
  }

  protected loadMore(): void {
    const kind = this.kind();
    const nextPage = this.page() + 1;
    this.loadingMore.set(true);
    this.signalsHttp.getCatalogPage(kind, nextPage, PAGE_LIMIT).subscribe({
      next: (res) => {
        this.rows.update((current) => [...current, ...res.data.map((item) => this.toRow(kind, item))]);
        this.page.set(res.meta.page);
        this.hasMore.set(res.meta.page < res.meta.totalPages);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  private toRow(kind: EntityKind, item: { id: string; title: string; imageUri?: string; appearanceCount: number }): Row {
    return {
      id: item.id,
      title: kind === 'feelings' ? (FEELING_TITLE_EN_TO_LABEL[item.title] ?? item.title) : item.title,
      imageUrl: item.imageUri ?? null,
      appearanceCount: item.appearanceCount,
    };
  }

  protected goEntity(id: string): void {
    this.router.navigate(['/signals', this.kind(), id]);
  }
}
