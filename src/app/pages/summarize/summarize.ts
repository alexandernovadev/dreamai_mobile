import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Radio } from '../../ui/radio/radio';
import { Select, type SelectOption } from '../../ui/select/select';
import { DateField } from '../../ui/date-field/date-field';
import { Button } from '../../ui/button/button';
import { MarkdownRenderer } from '../../ui/dream/markdown-renderer/markdown-renderer';
import { DreamSessionHttpService } from '../../core/http/dream-session-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import type {
  SummarizeRecentInput,
  SummarizeRecentLimit,
  SummarizeRecentResponse,
} from '../../core/models/dream-session.model';

type Mode = 'limit' | 'dates';

const LIMIT_OPTIONS: SelectOption[] = [5, 10, 15, 20].map((n) => ({
  value: String(n),
  label: `${n} sueños`,
}));

function errorMessageFrom(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' ');
    if (typeof msg === 'string') return msg;
  }
  return 'No se pudo generar el resumen. Revisá que el servidor esté corriendo.';
}

/**
 * `/summarize` — cross-session AI pattern summary (not tied to one dream).
 * Mirrors dreamai_app's `summarize.tsx` mode toggle (last N vs. date range)
 * with frontdreams' own primitives.
 */
@Component({
  selector: 'app-summarize',
  imports: [Radio, Select, DateField, Button, MarkdownRenderer],
  templateUrl: './summarize.html',
  styleUrl: './summarize.scss',
})
export class Summarize {
  private readonly dreamSessionHttp = inject(DreamSessionHttpService);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly limitOptions = LIMIT_OPTIONS;

  protected readonly mode = signal<Mode>('limit');
  protected readonly limitChoice = signal('10');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<SummarizeRecentResponse | null>(null);

  constructor() {
    this.pageHeader.set('Resumen con IA', 'Patrones en tus sueños recientes', true);
  }

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  protected generate(): void {
    this.error.set(null);

    let dto: SummarizeRecentInput;
    if (this.mode() === 'dates') {
      const from = this.dateFrom();
      const to = this.dateTo();
      if (!from || !to) {
        this.error.set('Elegí las dos fechas — desde y hasta.');
        return;
      }
      if (to < from) {
        this.error.set('La fecha "hasta" debe ser igual o posterior a "desde".');
        return;
      }
      dto = { dreamDateFrom: from, dreamDateTo: to };
    } else {
      dto = { limit: Number(this.limitChoice()) as SummarizeRecentLimit };
    }

    this.loading.set(true);
    this.dreamSessionHttp.summarizeRecent(dto).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessageFrom(err));
        this.loading.set(false);
      },
    });
  }
}
