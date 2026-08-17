import { Component, computed, input, model, output } from '@angular/core';
import { Input } from '../../input/input';
import { Chip } from '../../chip/chip';
import { ENTITY_LABEL, type EntityKind } from '../entity-kind';

export type SearchAndAttachOption = { id: string; label: string };

/**
 * Search an existing entity → attach it, or create a new one — the one
 * interaction dreamai_app repeats per entity type (character/location/object/
 * feeling/event/life-context), each with its own near-duplicate modal.
 * Parameterized by `entityType` so this single component covers all six.
 */
@Component({
  selector: 'app-search-and-attach',
  imports: [Input, Chip],
  templateUrl: './search-and-attach.html',
  styleUrl: './search-and-attach.scss',
})
export class SearchAndAttach {
  readonly entityType = input.required<EntityKind>();
  readonly suggestions = input<SearchAndAttachOption[]>([]);
  readonly attached = input<SearchAndAttachOption[]>([]);
  readonly creatable = input(true);
  readonly placeholder = input('Buscar…');

  readonly query = model('');

  readonly attachItem = output<string>();
  readonly detachItem = output<string>();
  readonly createNew = output<string>();

  protected readonly label = computed(() => ENTITY_LABEL[this.entityType()]);
  protected readonly trimmedQuery = computed(() => this.query().trim());
  protected readonly showDropdown = computed(
    () => this.trimmedQuery().length > 0,
  );

  protected onCreateNew(): void {
    const q = this.trimmedQuery();
    if (!q) return;
    this.createNew.emit(q);
    this.query.set('');
  }

  protected onSuggestionClick(id: string): void {
    this.attachItem.emit(id);
    this.query.set('');
  }
}
