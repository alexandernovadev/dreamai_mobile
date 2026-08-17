import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { EntityKind } from '../../ui/dream/entity-kind';

export interface SignalsHubItem {
  id: string;
  title: string;
  imageUri?: string;
  appearanceCount: number;
}

/** Mirrors `SignalsHubResponseDto` — note `lifeContext` (camelCase), unlike
 * every other kind key which matches `EntityKind` verbatim. */
export interface SignalsHubResponse {
  characters: SignalsHubItem[];
  locations: SignalsHubItem[];
  objects: SignalsHubItem[];
  events: SignalsHubItem[];
  lifeContext: SignalsHubItem[];
  feelings: SignalsHubItem[];
}

export interface SignalsCatalogPage {
  data: SignalsHubItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const HUB_KEY: Record<EntityKind, keyof SignalsHubResponse> = {
  characters: 'characters',
  locations: 'locations',
  objects: 'objects',
  events: 'events',
  'life-context': 'lifeContext',
  feelings: 'feelings',
};

/** `GET /signals/hub` and `GET /signals/catalog/:entity` — purpose-built,
 * single-request alternatives to fanning out 6 `CatalogHttpService.findAll`
 * calls; also the only source for `appearanceCount` (dream-session refs). */
@Injectable({ providedIn: 'root' })
export class SignalsHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/signals`;

  getHub(): Observable<SignalsHubResponse> {
    return this.http.get<SignalsHubResponse>(`${this.base}/hub`);
  }

  getCatalogPage(
    kind: EntityKind,
    page: number,
    limit = 24,
  ): Observable<SignalsCatalogPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<SignalsCatalogPage>(`${this.base}/catalog/${kind}`, { params });
  }

  hubItemsOf(response: SignalsHubResponse, kind: EntityKind): SignalsHubItem[] {
    return response[HUB_KEY[kind]];
  }
}
