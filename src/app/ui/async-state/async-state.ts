import { Component, input, output } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-async-state',
  imports: [Button],
  templateUrl: './async-state.html',
  styleUrl: './async-state.scss',
})
export class AsyncState {
  readonly loading = input(false);
  readonly loadingText = input('Cargando…');
  readonly error = input<string | null>(null);
  readonly retryLabel = input('Reintentar');

  readonly retry = output<void>();
}
