import { Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogHttpService } from '../../core/http/catalog-http.service';
import { CloudinaryHttpService } from '../../core/http/cloudinary-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { AsyncState } from '../../ui/async-state/async-state';
import { Button } from '../../ui/button/button';
import {
  EntityForm,
  type EntityFormSaveEvent,
  type EntityFormValue,
} from '../../ui/dream/entity-form/entity-form';
import { ENTITY_LABEL, type EntityKind } from '../../ui/dream/entity-kind';

/** `/signals/:kind/:id` — edit-in-place, no separate read-only detail view;
 * `EntityForm` already shows the current values. */
@Component({
  selector: 'app-signals-entity-edit',
  imports: [AsyncState, EntityForm, Button],
  templateUrl: './signals-entity-edit.html',
  styleUrl: './signals-entity-edit.scss',
})
export class SignalsEntityEdit {
  // Both bound from route params via withComponentInputBinding().
  readonly kind = input.required<EntityKind>();
  readonly id = input.required<string>();

  private readonly catalogHttp = inject(CatalogHttpService);
  private readonly cloudinaryHttp = inject(CloudinaryHttpService);
  private readonly router = inject(Router);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly initialValue = signal<EntityFormValue>({});
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);

  constructor() {
    // Required inputs aren't guaranteed set inside the constructor body
    // itself — effect() runs after Angular applies route-bound inputs.
    effect(() => {
      const kind = this.kind();
      this.pageHeader.set('Editar', ENTITY_LABEL[kind], true, ['/signals', kind]);
      this.load(kind, this.id());
    });
  }

  protected load(kind: EntityKind = this.kind(), id: string = this.id()): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalogHttp.findOne<EntityFormValue>(kind, id).subscribe({
      next: (row) => {
        this.initialValue.set(row);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar.');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/signals', this.kind()]);
  }

  protected onSave(event: EntityFormSaveEvent): void {
    const kind = this.kind();
    const id = this.id();
    const canHaveImage = kind === 'characters' || kind === 'locations' || kind === 'objects';
    this.saving.set(true);

    if (event.imageFile && canHaveImage) {
      this.cloudinaryHttp.upload(event.imageFile, kind).subscribe({
        next: (res) => this.finishSave(kind, id, { ...event.value, imageUri: res.secureUrl }),
        error: () => this.saving.set(false),
      });
    } else {
      this.finishSave(kind, id, event.value);
    }
  }

  private finishSave(kind: EntityKind, id: string, value: EntityFormValue): void {
    this.catalogHttp.update(kind, id, value).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/signals', kind]);
      },
      error: () => this.saving.set(false),
    });
  }

  protected onDelete(): void {
    if (this.deleting()) return;
    const kind = this.kind();
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    this.deleting.set(true);
    this.catalogHttp.remove(kind, this.id()).subscribe({
      next: () => this.router.navigate(['/signals', kind]),
      error: () => {
        this.deleting.set(false);
        this.error.set('No se pudo eliminar.');
      },
    });
  }
}
