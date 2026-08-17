import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { DreamSessionHttpService } from '../../core/http/dream-session-http.service';
import { CatalogHttpService } from '../../core/http/catalog-http.service';
import { CloudinaryHttpService } from '../../core/http/cloudinary-http.service';
import {
  DREAM_KIND_LABEL,
  DREAM_KIND_VALUES,
  DREAM_PERSPECTIVE_LABEL,
  type DreamElementsSuggestResponse,
  type DreamPerspective,
  type DreamSessionInput,
  type DreamSessionStatus,
  type MatchedCatalogRef,
} from '../../core/models/dream-session.model';
import { ENTITY_PRIMARY_FIELD, entityLabelOf } from '../../core/utils/entity-label.util';

import { PageHeaderService } from '../../core/services/page-header.service';
import { StatusBadge } from '../../ui/status-badge/status-badge';
import { Textarea } from '../../ui/textarea/textarea';
import { Chip } from '../../ui/chip/chip';
import { DateField } from '../../ui/date-field/date-field';
import { Slider } from '../../ui/slider/slider';
import { Button } from '../../ui/button/button';
import { AsyncState } from '../../ui/async-state/async-state';
import { MarkdownRenderer } from '../../ui/dream/markdown-renderer/markdown-renderer';
import { HeroImageCarousel } from '../../ui/dream/hero-image-carousel/hero-image-carousel';
import { ImageUploadField } from '../../ui/dream/image-upload-field/image-upload-field';
import { SearchAndAttach, type SearchAndAttachOption } from '../../ui/dream/search-and-attach/search-and-attach';
import { EntityForm, type EntityFormSaveEvent, type EntityFormValue } from '../../ui/dream/entity-form/entity-form';
import {
  ENTITY_KINDS,
  ENTITY_KIND_REQUIRES_DREAM_SESSION,
  ENTITY_KIND_SEARCH_PARAM,
  ENTITY_LABEL,
  type EntityKind,
} from '../../ui/dream/entity-kind';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SEARCHABLE_KINDS: EntityKind[] = ENTITY_KINDS.filter((k) => k !== 'feelings');

const TEXT_DEBOUNCE_MS = 700;

function emptyByKind<T>(fill: () => T): Record<EntityKind, T> {
  const result = {} as Record<EntityKind, T>;
  for (const k of ENTITY_KINDS) result[k] = fill();
  return result;
}

/**
 * Single flat editing surface for /dreams/new and /dreams/:id/edit — replaces
 * dreamai_app's 4-step locked wizard. All sections are always mounted; the
 * only real gate is "does a sessionId exist yet" (a hard backend constraint,
 * not a UI convention), and even that is minted lazily/silently on first
 * meaningful edit instead of behind an explicit "save draft" step.
 */
@Component({
  selector: 'app-dream-editor',
  imports: [
    StatusBadge,
    Textarea,
    Chip,
    DateField,
    Slider,
    Button,
    AsyncState,
    MarkdownRenderer,
    HeroImageCarousel,
    ImageUploadField,
    SearchAndAttach,
    EntityForm,
  ],
  templateUrl: './dream-editor.html',
  styleUrl: './dream-editor.scss',
})
export class DreamEditor {
  // Bound automatically from the `:id` route param via withComponentInputBinding().
  readonly id = input<string | undefined>(undefined);

  private readonly dreamSessionHttp = inject(DreamSessionHttpService);
  private readonly catalogHttp = inject(CatalogHttpService);
  private readonly cloudinaryHttp = inject(CloudinaryHttpService);
  private readonly location = inject(Location);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly dreamKindValues = DREAM_KIND_VALUES;
  protected readonly dreamKindLabel = DREAM_KIND_LABEL;
  protected readonly perspectiveValues: DreamPerspective[] = ['ACTOR', 'OBSERVER'];
  protected readonly perspectiveLabel = DREAM_PERSPECTIVE_LABEL;
  protected readonly searchableKinds = SEARCHABLE_KINDS;
  protected readonly entityLabel = ENTITY_LABEL;

  protected readonly loading = signal(false);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly saveState = signal<SaveState>('idle');

  protected readonly rawNarrative = signal('');
  protected readonly dreamKind = signal<string[]>([]);
  protected readonly timestamp = signal('');
  protected readonly dreamImages = signal<string[]>([]);
  protected readonly perspectives = signal<DreamPerspective[]>([]);
  protected readonly lucidityLevel = signal(0);
  protected readonly userThought = signal('');
  protected readonly aiSummarize = signal<string | null>(null);

  protected readonly attachedByKind = signal<Record<EntityKind, SearchAndAttachOption[]>>(
    emptyByKind(() => []),
  );
  protected readonly suggestionsByKind = signal<Record<EntityKind, SearchAndAttachOption[]>>(
    emptyByKind(() => []),
  );
  protected readonly queryByKind = signal<Record<EntityKind, string>>(emptyByKind(() => ''));

  protected readonly creatingKind = signal<EntityKind | null>(null);
  protected readonly creatingSeed = signal<EntityFormValue>({});
  protected readonly creatingSaving = signal(false);

  protected readonly uploadingDreamImage = signal(false);
  protected readonly aiElementSuggestions = signal<DreamElementsSuggestResponse | null>(null);
  protected readonly suggestingElements = signal(false);
  protected readonly suggestingThought = signal(false);

  protected readonly canSuggest = computed(
    () => this.rawNarrative().trim().length > 0 && this.sessionId() !== null,
  );

  protected readonly status = computed<DreamSessionStatus>(() => {
    if (this.userThought().trim().length > 0 || (this.aiSummarize()?.trim().length ?? 0) > 0) {
      return 'THOUGHT';
    }
    if (
      this.dreamKind().length > 0 ||
      this.dreamImages().length > 0 ||
      this.perspectives().length > 0 ||
      this.lucidityLevel() > 0
    ) {
      return 'STRUCTURED';
    }
    if (Object.values(this.attachedByKind()).some((list) => list.length > 0)) {
      return 'ELEMENTS';
    }
    return 'DRAFT';
  });

  private textSaveTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly aiSuggestionGroups = computed(() => {
    const res = this.aiElementSuggestions();
    if (!res) return [];
    return (
      [
        { kind: 'characters' as EntityKind, rows: res.characters.map((r) => ({ label: r.fromAi.name, match: r.match })) },
        { kind: 'locations' as EntityKind, rows: res.locations.map((r) => ({ label: r.fromAi.name, match: r.match })) },
        { kind: 'objects' as EntityKind, rows: res.objects.map((r) => ({ label: r.fromAi.name, match: r.match })) },
        { kind: 'events' as EntityKind, rows: res.events.map((r) => ({ label: r.fromAi.label, match: r.match })) },
      ] satisfies { kind: EntityKind; rows: { label: string; match: MatchedCatalogRef | null }[] }[]
    ).filter((g) => g.rows.length > 0);
  });

  constructor() {
    effect(() => {
      const routeId = this.id();
      this.pageHeader.set(routeId ? 'Editar sueño' : 'Nuevo sueño', 'Diario onírico', true);
      if (routeId) this.loadSession(routeId);
    });
  }

  // ── Loading an existing session ──────────────────────────────────────────

  private loadSession(id: string): void {
    this.sessionId.set(id);
    this.loading.set(true);
    this.dreamSessionHttp.getHydrated(id).subscribe({
      next: ({ session, hydrated }) => {
        this.rawNarrative.set(session.rawNarrative);
        this.dreamKind.set(session.dreamKind);
        this.timestamp.set(session.timestamp?.slice(0, 10) ?? '');
        this.dreamImages.set(session.dreamImages);
        this.perspectives.set(session.analysis?.perspectives ?? []);
        this.lucidityLevel.set(session.analysis?.lucidityLevel ?? 0);
        this.userThought.set(session.userThought ?? '');
        this.aiSummarize.set(session.aiSummarize ?? null);
        const toOptions = (kind: EntityKind, record: Record<string, { id: string }>) =>
          Object.values(record).map((e) => ({
            id: e.id,
            label: entityLabelOf(kind, e as unknown as Record<string, unknown>),
          }));
        this.attachedByKind.set({
          characters: toOptions('characters', hydrated.characters),
          locations: toOptions('locations', hydrated.locations),
          objects: toOptions('objects', hydrated.objects),
          events: toOptions('events', hydrated.events),
          'life-context': toOptions('life-context', hydrated.contextLife),
          feelings: toOptions('feelings', hydrated.feelings),
        });
        this.loading.set(false);
        this.saveState.set('saved');
      },
      error: () => {
        this.loading.set(false);
        this.saveState.set('error');
      },
    });
  }

  // ── Autosave ──────────────────────────────────────────────────────────────

  private buildDto(): DreamSessionInput {
    const attached = this.attachedByKind();
    return {
      timestamp: this.timestamp() ? `${this.timestamp()}T00:00:00.000Z` : undefined,
      rawNarrative: this.rawNarrative(),
      dreamKind: this.dreamKind(),
      dreamImages: this.dreamImages(),
      userThought: this.userThought() || undefined,
      analysis: {
        perspectives: this.perspectives(),
        lucidityLevel: this.lucidityLevel(),
        entities: {
          characters: attached.characters.map((o) => ({ characterId: o.id })),
          locations: attached.locations.map((o) => ({ locationId: o.id })),
          objects: attached.objects.map((o) => ({ objectId: o.id })),
          events: attached.events.map((o) => ({ eventId: o.id })),
          contextLife: attached['life-context'].map((o) => ({ contextLifeId: o.id })),
          feelings: attached.feelings.map((o) => ({ feelingId: o.id })),
        },
      },
      status: this.status(),
    };
  }

  /** Structural changes (chips, entity attach/detach, sliders, dates) save
   * right away — only free-text fields go through the debounce below. */
  protected persist(): void {
    const id = this.sessionId();
    if (!id && !this.rawNarrative().trim()) return; // lazy mint guard

    const dto = this.buildDto();
    this.saveState.set('saving');
    const req$ = id ? this.dreamSessionHttp.update(id, dto) : this.dreamSessionHttp.create(dto);
    req$.subscribe({
      next: (session) => {
        if (!id) {
          this.sessionId.set(session.id);
          this.location.replaceState(`/dreams/${session.id}/edit`);
        }
        this.saveState.set('saved');
      },
      error: () => this.saveState.set('error'),
    });
  }

  private scheduleDebouncedPersist(): void {
    if (this.textSaveTimer) clearTimeout(this.textSaveTimer);
    this.textSaveTimer = setTimeout(() => {
      this.textSaveTimer = null;
      this.persist();
    }, TEXT_DEBOUNCE_MS);
  }

  private flushDebouncedPersist(): void {
    if (this.textSaveTimer) {
      clearTimeout(this.textSaveTimer);
      this.textSaveTimer = null;
    }
    this.persist();
  }

  /** Ensures a sessionId exists, minting one immediately if needed — used by
   * actions (create event/feeling) that have a hard backend dependency on it
   * even before the user has written any narrative. */
  private ensureSessionId(): Observable<string> {
    const existing = this.sessionId();
    if (existing) return of(existing);
    this.saveState.set('saving');
    return this.dreamSessionHttp.create(this.buildDto()).pipe(
      tap((session) => {
        this.sessionId.set(session.id);
        this.location.replaceState(`/dreams/${session.id}/edit`);
        this.saveState.set('saved');
      }),
      map((session) => session.id),
    );
  }

  // ── Narrative / reflection (debounced) ───────────────────────────────────

  protected onNarrativeInput(value: string): void {
    this.rawNarrative.set(value);
    this.scheduleDebouncedPersist();
  }

  protected onUserThoughtInput(value: string): void {
    this.userThought.set(value);
    this.scheduleDebouncedPersist();
  }

  protected onTextFieldBlur(): void {
    this.flushDebouncedPersist();
  }

  // ── Structural fields (immediate) ────────────────────────────────────────

  protected toggleDreamKind(value: string): void {
    this.dreamKind.update((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
    this.persist();
  }

  protected togglePerspective(value: DreamPerspective): void {
    this.perspectives.update((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
    this.persist();
  }

  protected onTimestampChange(value: string): void {
    this.timestamp.set(value);
    this.persist();
  }

  protected onLucidityChange(value: number): void {
    this.lucidityLevel.set(value);
    this.persist();
  }

  protected onDreamImagePicked(file: File): void {
    this.uploadingDreamImage.set(true);
    this.cloudinaryHttp.upload(file, 'dreams').subscribe({
      next: (res) => {
        this.dreamImages.update((list) => [...list, res.secureUrl]);
        this.uploadingDreamImage.set(false);
        this.persist();
      },
      error: () => this.uploadingDreamImage.set(false),
    });
  }

  protected removeDreamImage(url: string): void {
    this.dreamImages.update((list) => list.filter((u) => u !== url));
    this.persist();
  }

  // ── Elements: search / attach / detach / create ──────────────────────────

  protected onSearchQueryChange(kind: EntityKind, query: string): void {
    this.queryByKind.update((m) => ({ ...m, [kind]: query }));
    const param = ENTITY_KIND_SEARCH_PARAM[kind];
    if (!param || !query.trim()) {
      this.suggestionsByKind.update((m) => ({ ...m, [kind]: [] }));
      return;
    }
    this.catalogHttp
      .findAll<Record<string, unknown> & { id: string }>(kind, {
        [param]: query.trim(),
        limit: 8,
      })
      .subscribe((rows) => {
        const attachedIds = new Set(this.attachedByKind()[kind].map((a) => a.id));
        this.suggestionsByKind.update((m) => ({
          ...m,
          [kind]: rows
            .filter((r) => !attachedIds.has(r['id']))
            .map((r) => ({ id: r['id'], label: entityLabelOf(kind, r) })),
        }));
      });
  }

  protected onAttach(kind: EntityKind, id: string): void {
    const suggestion = this.suggestionsByKind()[kind].find((s) => s.id === id);
    if (!suggestion) return;
    this.attachOption(kind, suggestion);
  }

  protected onDetach(kind: EntityKind, id: string): void {
    this.attachedByKind.update((m) => ({
      ...m,
      [kind]: m[kind].filter((a) => a.id !== id),
    }));
    this.persist();
  }

  private attachOption(kind: EntityKind, option: SearchAndAttachOption): void {
    this.attachedByKind.update((m) =>
      m[kind].some((a) => a.id === option.id)
        ? m
        : { ...m, [kind]: [...m[kind], option] },
    );
    this.suggestionsByKind.update((m) => ({ ...m, [kind]: [] }));
    this.persist();
  }

  // ── Inline entity creation ───────────────────────────────────────────────

  protected onCreateNew(kind: EntityKind, label: string): void {
    const field = ENTITY_PRIMARY_FIELD[kind];
    this.creatingKind.set(kind);
    this.creatingSeed.set(field ? { [field]: label } : {});
  }

  protected startCreateFeeling(): void {
    this.creatingKind.set('feelings');
    this.creatingSeed.set({});
  }

  protected onEntityFormCancel(): void {
    this.creatingKind.set(null);
    this.creatingSeed.set({});
  }

  protected onEntityFormSave(kind: EntityKind, event: EntityFormSaveEvent): void {
    const canHaveImage = kind === 'characters' || kind === 'locations' || kind === 'objects';
    this.creatingSaving.set(true);

    if (event.imageFile && canHaveImage) {
      this.cloudinaryHttp.upload(event.imageFile, kind).subscribe({
        next: (res) => this.finishEntityCreate(kind, { ...event.value, imageUri: res.secureUrl }),
        error: () => this.creatingSaving.set(false),
      });
    } else {
      this.finishEntityCreate(kind, event.value);
    }
  }

  private finishEntityCreate(kind: EntityKind, value: EntityFormValue): void {
    const create = (currentSessionId: string | null) => {
      const dto: Record<string, unknown> = { ...value };
      if (ENTITY_KIND_REQUIRES_DREAM_SESSION[kind] && currentSessionId) {
        dto['dreamSessionId'] = currentSessionId;
      }
      this.catalogHttp.create<Record<string, unknown> & { id: string }>(kind, dto).subscribe({
        next: (created) => {
          this.attachOption(kind, { id: created.id, label: entityLabelOf(kind, created) });
          this.creatingKind.set(null);
          this.creatingSeed.set({});
          this.creatingSaving.set(false);
        },
        error: () => this.creatingSaving.set(false),
      });
    };

    if (ENTITY_KIND_REQUIRES_DREAM_SESSION[kind]) {
      this.ensureSessionId().subscribe({
        next: create,
        error: () => this.creatingSaving.set(false),
      });
    } else {
      create(this.sessionId());
    }
  }

  // ── AI suggestions ────────────────────────────────────────────────────────

  protected suggestElements(): void {
    const id = this.sessionId();
    if (!id || !this.canSuggest()) return;
    this.suggestingElements.set(true);
    this.dreamSessionHttp.suggestElements(id).subscribe({
      next: (res) => {
        this.aiElementSuggestions.set(res);
        this.suggestingElements.set(false);
      },
      error: () => this.suggestingElements.set(false),
    });
  }

  protected dismissAiSuggestions(): void {
    this.aiElementSuggestions.set(null);
  }

  protected attachAiMatch(kind: EntityKind, match: MatchedCatalogRef): void {
    this.attachOption(kind, { id: match.catalogId, label: match.canonicalLabel });
  }

  protected createFromAiSuggestion(kind: EntityKind, seedLabel: string): void {
    this.onCreateNew(kind, seedLabel);
    this.aiElementSuggestions.set(null);
  }

  protected suggestThought(): void {
    const id = this.sessionId();
    if (!id || !this.canSuggest()) return;
    this.suggestingThought.set(true);
    this.dreamSessionHttp.suggestThought(id).subscribe({
      next: (res) => {
        this.aiSummarize.set(res.suggestion);
        this.suggestingThought.set(false);
        // Old app's behavior, preserved: the AI reading autosaves the moment
        // it's generated — there's no separate "save" step for it.
        this.dreamSessionHttp.update(id, { aiSummarize: res.suggestion }).subscribe();
      },
      error: () => this.suggestingThought.set(false),
    });
  }
}
