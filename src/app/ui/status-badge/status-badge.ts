import { Component, computed, input } from '@angular/core';

/** Dream session workflow: draft → elements → structured → thought. */
export type DreamStatus = 'DRAFT' | 'ELEMENTS' | 'STRUCTURED' | 'THOUGHT';

const STATUS_LABEL: Record<DreamStatus, string> = {
  DRAFT: 'Borrador',
  ELEMENTS: 'Elementos',
  STRUCTURED: 'Detalle',
  THOUGHT: 'Reflexión',
};

const STATUS_CLASS: Record<DreamStatus, string> = {
  DRAFT: 'status-badge--draft',
  ELEMENTS: 'status-badge--elements',
  STRUCTURED: 'status-badge--structured',
  THOUGHT: 'status-badge--thought',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly status = input.required<DreamStatus>();

  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
  protected readonly toneClass = computed(() => STATUS_CLASS[this.status()]);
}
