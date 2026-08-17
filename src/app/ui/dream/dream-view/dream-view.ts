import { Component, computed, input } from '@angular/core';
import { HeroImageCarousel } from '../hero-image-carousel/hero-image-carousel';
import { StatusBadge } from '../../status-badge/status-badge';
import { Chip } from '../../chip/chip';
import { EntityCard } from '../entity-card/entity-card';
import { MarkdownRenderer } from '../markdown-renderer/markdown-renderer';
import { ENTITY_LABEL, type EntityKind } from '../entity-kind';
import {
  DREAM_KIND_LABEL,
  DREAM_PERSPECTIVE_LABEL,
  type DreamSession,
  type HydratedDreamSessionResponse,
  type HydratedEntityRef,
} from '../../../core/models/dream-session.model';
import { entityLabelOf } from '../../../core/utils/entity-label.util';
import { dreamDateLabel } from '../../../core/utils/dream-format.util';

type HydratedEntities = HydratedDreamSessionResponse['hydrated'];
type EntityGroup = {
  kind: EntityKind;
  items: { id: string; label: string; imageUrl: string | null }[];
};

/**
 * Read-only rendering of a dream — narrative, elements, reflection, images.
 * Pure presentational (no HTTP): used by the single-detail route
 * (`/dreams/:id`), which owns the data fetching and just feeds this
 * component a hydrated session.
 */
@Component({
  selector: 'app-dream-view',
  imports: [HeroImageCarousel, StatusBadge, Chip, EntityCard, MarkdownRenderer],
  templateUrl: './dream-view.html',
  styleUrl: './dream-view.scss',
})
export class DreamView {
  readonly session = input.required<DreamSession>();
  readonly hydrated = input.required<HydratedEntities>();

  protected readonly entityLabel = ENTITY_LABEL;
  protected readonly perspectiveLabel = DREAM_PERSPECTIVE_LABEL;

  protected readonly dateLabel = computed(() => dreamDateLabel(this.session()));

  // `dreamKind` is stored as free-form string[] in the schema (not a closed
  // union at the type level), so indexing the label map needs a fallback.
  protected dreamKindLabelOf(kind: string): string {
    return (DREAM_KIND_LABEL as Record<string, string>)[kind] ?? kind;
  }

  protected readonly entityGroups = computed<EntityGroup[]>(() => {
    const h = this.hydrated();
    const mapping: { kind: EntityKind; record: Record<string, HydratedEntityRef> }[] = [
      { kind: 'characters', record: h.characters },
      { kind: 'locations', record: h.locations },
      { kind: 'objects', record: h.objects },
      { kind: 'events', record: h.events },
      { kind: 'life-context', record: h.contextLife },
      { kind: 'feelings', record: h.feelings },
    ];
    return mapping
      .map(({ kind, record }) => ({
        kind,
        items: Object.values(record).map((row) => ({
          id: row.id,
          label: entityLabelOf(kind, row as unknown as Record<string, unknown>),
          imageUrl: row.imageUri ?? null,
        })),
      }))
      .filter((g) => g.items.length > 0);
  });

  protected readonly hasEntities = computed(() => this.entityGroups().length > 0);
  protected readonly hasPerspectiveOrLucidity = computed(() => {
    const a = this.session().analysis;
    return !!a && ((a.perspectives?.length ?? 0) > 0 || a.lucidityLevel != null);
  });
  protected readonly hasReflection = computed(
    () => !!this.session().userThought?.trim() || !!this.session().aiSummarize?.trim(),
  );
}
