import { Component, computed, input, output, signal } from '@angular/core';
import { Input } from '../../input/input';
import { Textarea } from '../../textarea/textarea';
import { Switch } from '../../switch/switch';
import { Select } from '../../select/select';
import { Slider } from '../../slider/slider';
import { Button } from '../../button/button';
import { ImageUploadField } from '../image-upload-field/image-upload-field';
import { ENTITY_FIELD_CONFIG, type EntityFieldType, type EntityKind } from '../entity-kind';

export type EntityFormValue = Record<string, unknown>;

export interface EntityFormSaveEvent {
  value: EntityFormValue;
  /** Raw file if the user picked a new image — upload is the caller's job. */
  imageFile: File | null;
}

function defaultFor(type: EntityFieldType): unknown {
  switch (type) {
    case 'switch':
      return false;
    case 'slider':
      return 0;
    case 'select':
    case 'image':
      return null;
    default:
      return '';
  }
}

/**
 * The single generic entity form — create AND edit, for all 6 catalog types
 * — that replaces dreamai_app's 6 near-duplicate modals plus its 6
 * near-duplicate inline edit blocks. Field set comes entirely from
 * `ENTITY_FIELD_CONFIG[entityType]` (entity-kind.ts); this component has no
 * per-type branching of its own.
 */
@Component({
  selector: 'app-entity-form',
  imports: [Input, Textarea, Switch, Select, Slider, Button, ImageUploadField],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.scss',
})
export class EntityForm {
  readonly entityType = input.required<EntityKind>();
  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<EntityFormValue>({});
  readonly saving = input(false);

  readonly save = output<EntityFormSaveEvent>();
  readonly cancel = output<void>();

  protected readonly fields = computed(() => ENTITY_FIELD_CONFIG[this.entityType()]);

  // Only what the user has actually touched — everything else falls back to
  // `initialValue()`, so an external `initialValue` reference change (e.g.
  // the parent patching in an uploaded image URL) never wipes in-progress edits.
  private readonly overrides = signal<EntityFormValue>({});
  private readonly pickedImageFile = signal<File | null>(null);

  protected readonly isValid = computed(() =>
    this.fields().every((f) => {
      if (!f.required) return true;
      const v = this.valueOf(f.key);
      return typeof v === 'string' ? v.trim().length > 0 : v != null;
    }),
  );

  protected valueOf(key: string): unknown {
    const overrides = this.overrides();
    if (key in overrides) return overrides[key];
    return this.initialValue()[key];
  }

  protected stringValue(key: string): string {
    return (this.valueOf(key) as string | undefined) ?? '';
  }

  protected boolValue(key: string): boolean {
    return (this.valueOf(key) as boolean | undefined) ?? false;
  }

  protected numberValue(key: string): number {
    return (this.valueOf(key) as number | undefined) ?? 0;
  }

  protected stringOrNullValue(key: string): string | null {
    return (this.valueOf(key) as string | null | undefined) ?? null;
  }

  protected setValue(key: string, value: unknown): void {
    this.overrides.update((v) => ({ ...v, [key]: value }));
  }

  protected onImagePicked(key: string, file: File): void {
    this.pickedImageFile.set(file);
    // Don't set the field value here — ImageUploadField already shows an
    // optimistic local preview on its own; the real `imageUri` only exists
    // once the caller uploads `imageFile` and the entity is saved.
    void key;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.isValid() || this.saving()) return;

    const value: EntityFormValue = {};
    for (const f of this.fields()) {
      value[f.key] = this.valueOf(f.key) ?? defaultFor(f.type);
    }
    this.save.emit({ value, imageFile: this.pickedImageFile() });
  }
}
