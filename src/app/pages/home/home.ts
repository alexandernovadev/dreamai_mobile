import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncState } from '../../ui/async-state/async-state';
import { DreamCard } from '../../ui/dream/dream-card/dream-card';
import { DreamSessionHttpService } from '../../core/http/dream-session-http.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import type { DreamSession } from '../../core/models/dream-session.model';
import { dreamDateLabel, dreamSnippet } from '../../core/utils/dream-format.util';

/** Dream list — the app's home/landing screen. Nav to new, and the
 * page title itself, both live in the app shell now, not repeated here. */
@Component({
  selector: 'app-home',
  imports: [AsyncState, DreamCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly dreamSessionHttp = inject(DreamSessionHttpService);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly dreams = signal<DreamSession[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly dreamDateLabel = dreamDateLabel;
  protected readonly dreamSnippet = dreamSnippet;

  constructor() {
    this.pageHeader.set('Sueños', 'Tu diario onírico', false);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dreamSessionHttp.list({ limit: 60 }).subscribe({
      next: (res) => {
        this.dreams.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los sueños. Revisá que el servidor esté corriendo.');
        this.loading.set(false);
      },
    });
  }

  protected goView(id: string): void {
    this.router.navigate(['/dreams', id]);
  }

  protected goEdit(id: string): void {
    this.router.navigate(['/dreams', id, 'edit']);
  }
}
