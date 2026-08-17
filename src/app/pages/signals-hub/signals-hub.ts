import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SignalsHttpService } from '../../core/http/signals-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { FEELING_TITLE_EN_TO_LABEL } from '../../core/models/catalog.model';
import { AsyncState } from '../../ui/async-state/async-state';
import { EntityCard } from '../../ui/dream/entity-card/entity-card';
import { ENTITY_KINDS, ENTITY_LABEL, type EntityKind } from '../../ui/dream/entity-kind';

type HubRow = { id: string; title: string; imageUrl: string | null; appearanceCount: number };

/** `/signals` — one carousel per entity kind, "ver todos" into `/signals/:kind`.
 * Single `GET /signals/hub` call (backend batches 6 catalogs + appearance
 * counts in one request) instead of 6 separate `CatalogHttpService.findAll`. */
@Component({
  selector: 'app-signals-hub',
  imports: [RouterLink, AsyncState, EntityCard],
  templateUrl: './signals-hub.html',
  styleUrl: './signals-hub.scss',
})
export class SignalsHub {
  private readonly signalsHttp = inject(SignalsHttpService);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly kinds = ENTITY_KINDS;
  protected readonly entityLabel = ENTITY_LABEL;
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly rowsByKind = signal<Record<EntityKind, HubRow[]>>(
    Object.fromEntries(ENTITY_KINDS.map((k) => [k, []])) as unknown as Record<
      EntityKind,
      HubRow[]
    >,
  );

  constructor() {
    this.pageHeader.set('Signals', 'Figuras recurrentes en tus sueños', true);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.signalsHttp.getHub().subscribe({
      next: (hub) => {
        const byKind = {} as Record<EntityKind, HubRow[]>;
        for (const kind of ENTITY_KINDS) {
          byKind[kind] = this.signalsHttp.hubItemsOf(hub, kind).map((item) => ({
            id: item.id,
            title: kind === 'feelings' ? (FEELING_TITLE_EN_TO_LABEL[item.title] ?? item.title) : item.title,
            imageUrl: item.imageUri ?? null,
            appearanceCount: item.appearanceCount,
          }));
        }
        this.rowsByKind.set(byKind);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar Signals.');
        this.loading.set(false);
      },
    });
  }

  protected goEntity(kind: EntityKind, id: string): void {
    this.router.navigate(['/signals', kind, id]);
  }
}
