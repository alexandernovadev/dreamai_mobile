import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { PageHeaderService } from '../../core/services/page-header.service';
import { environment } from '../../../environments/environment';

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

interface BackendMeta {
  serviceName: string;
  version: string;
  buildAt: string;
  environment: string;
  commit: string;
}

/** `/more/system-info` — read-only debug panel: build mode, API origin, a
 * live ping to the backend's `/health`, and `/meta` (version/build/env/commit
 * — the backend's own doc comment names this screen as its purpose) so a
 * personal-project user can confirm which server they're pointed at without
 * opening devtools. */
@Component({
  selector: 'app-system-info',
  imports: [DatePipe],
  templateUrl: './system-info.html',
  styleUrl: './system-info.scss',
})
export class SystemInfo {
  private readonly http = inject(HttpClient);
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly appName = 'frontdreams';
  protected readonly buildMode = environment.production ? 'Producción' : 'Desarrollo';
  protected readonly apiBaseUrl = environment.apiBaseUrl;

  protected readonly connectionStatus = signal<ConnectionStatus>('checking');
  protected readonly backendMeta = signal<BackendMeta | null>(null);

  constructor() {
    this.pageHeader.set('Información del sistema', 'Más', true, ['/more']);
    this.checkConnection();
  }

  protected checkConnection(): void {
    this.connectionStatus.set('checking');
    this.backendMeta.set(null);
    this.http.get(`${this.apiBaseUrl}/health`).subscribe({
      next: () => {
        this.connectionStatus.set('connected');
        this.loadMeta();
      },
      error: () => this.connectionStatus.set('disconnected'),
    });
  }

  private loadMeta(): void {
    this.http.get<BackendMeta>(`${this.apiBaseUrl}/meta`).subscribe({
      next: (meta) => this.backendMeta.set(meta),
      error: () => this.backendMeta.set(null),
    });
  }
}
