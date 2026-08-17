import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderService } from '../../core/services/page-header.service';

type MoreRow = {
  path: string;
  label: string;
  description: string;
  icon: 'info' | 'bell' | 'totem' | 'audio';
};

/** `/more` — settings/tools hub, mirrors dreamai_app's `more/index.tsx`
 * (its dev-only "Catálogo UI" section is skipped, not relevant here). */
@Component({
  selector: 'app-more-hub',
  imports: [RouterLink],
  templateUrl: './more-hub.html',
  styleUrl: './more-hub.scss',
})
export class MoreHub {
  private readonly pageHeader = inject(PageHeaderService);

  protected readonly rows: MoreRow[] = [
    {
      path: '/more/system-info',
      label: 'Información del sistema',
      description: 'Versión, entorno y conexión al servidor',
      icon: 'info',
    },
    {
      path: '/more/alerts',
      label: 'Alertas',
      description: 'Recordatorios para registrar sueños',
      icon: 'bell',
    },
    {
      path: '/more/totem',
      label: 'Totem',
      description: 'Tu objeto de realidad onírica',
      icon: 'totem',
    },
    {
      path: '/more/audio-cues',
      label: 'Audio cues',
      description: 'Señales de audio durante el sueño',
      icon: 'audio',
    },
  ];

  constructor() {
    this.pageHeader.set('Más', 'Herramientas y ajustes', true);
  }
}
