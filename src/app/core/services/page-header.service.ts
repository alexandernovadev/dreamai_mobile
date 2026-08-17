import { Injectable, signal } from '@angular/core';

/**
 * The persistent top bar (app.html) shows the current page's title/subtitle
 * instead of a static brand wordmark — each routed page calls `set()` (in
 * its constructor, or reactively via `effect()` if the title depends on a
 * route input) so the shell always reflects "where you are."
 */
@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly title = signal('frontdreams');
  readonly subtitle = signal<string | null>(null);
  readonly showBack = signal(false);
  /** Router commands (as passed to `Router.navigate`) for the shell's back
   * button — defaults to home, but a nested page (e.g. `/more/system-info`)
   * should point back at its actual parent (`/more`), not always the root. */
  readonly backPath = signal<unknown[]>(['/']);

  set(
    title: string,
    subtitle: string | null = null,
    showBack = false,
    backPath: unknown[] = ['/'],
  ): void {
    this.title.set(title);
    this.subtitle.set(subtitle);
    this.showBack.set(showBack);
    this.backPath.set(backPath);
  }
}
