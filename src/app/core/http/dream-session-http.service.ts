import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  DreamAnalyticsOverview,
  DreamElementsSuggestResponse,
  DreamSession,
  DreamSessionInput,
  DreamSessionStatus,
  DreamThoughtSuggestResponse,
  HydratedDreamSessionResponse,
  SummarizeRecentInput,
  SummarizeRecentResponse,
} from '../models/dream-session.model';

export interface ListDreamSessionsQuery {
  page?: number;
  limit?: number;
  status?: DreamSessionStatus;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class DreamSessionHttpService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/dream-sessions`;

  create(dto: DreamSessionInput): Observable<DreamSession> {
    return this.http.post<DreamSession>(this.base, dto);
  }

  /** NOTE: like the catalog services, the backend's `findAll` uses Mongoose
   * `.lean()` — rows come back with only `_id`, normalized to `id` here. */
  list(query: ListDreamSessionsQuery = {}): Observable<PaginatedResponse<DreamSession>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params = params.set(key, String(value));
    }
    return this.http
      .get<PaginatedResponse<Record<string, unknown> & { _id: string }>>(this.base, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: res.data.map((row) => ({ ...row, id: row['_id'] }) as unknown as DreamSession),
        })),
      );
  }

  findOne(id: string): Observable<DreamSession> {
    return this.http.get<DreamSession>(`${this.base}/${id}`);
  }

  /** Lifetime aggregates — dream count, catalog totals, lucidity histogram,
   * top characters/locations/objects. Registered before `:id` on the backend. */
  analyticsOverview(): Observable<DreamAnalyticsOverview> {
    return this.http.get<DreamAnalyticsOverview>(`${this.base}/analytics/overview`);
  }

  /** NOTE: the hydrated endpoint's `session` is also a `.lean()` read on the
   * backend (unlike plain `findOne`) — same `_id` → `id` normalization applies. */
  getHydrated(id: string): Observable<HydratedDreamSessionResponse> {
    return this.http
      .get<{ session: Record<string, unknown> & { _id: string }; hydrated: HydratedDreamSessionResponse['hydrated'] }>(
        `${this.base}/${id}/hydrated`,
      )
      .pipe(
        map((res) => ({
          ...res,
          session: { ...res.session, id: res.session['_id'] } as unknown as DreamSession,
        })),
      );
  }

  update(id: string, dto: DreamSessionInput): Observable<DreamSession> {
    return this.http.patch<DreamSession>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  suggestElements(
    id: string,
    locale?: string,
  ): Observable<DreamElementsSuggestResponse> {
    return this.http.post<DreamElementsSuggestResponse>(
      `${this.base}/${id}/ai/suggest-elements`,
      locale ? { locale } : {},
    );
  }

  suggestThought(
    id: string,
    locale?: string,
  ): Observable<DreamThoughtSuggestResponse> {
    return this.http.post<DreamThoughtSuggestResponse>(
      `${this.base}/${id}/ai/suggest-thought`,
      locale ? { locale } : {},
    );
  }

  /** Cross-session — not scoped to one dream. Either `limit` OR the two
   * `dreamDate*` fields, never both (the backend 400s on a half-supplied range). */
  summarizeRecent(dto: SummarizeRecentInput): Observable<SummarizeRecentResponse> {
    return this.http.post<SummarizeRecentResponse>(`${this.base}/ai/summarize-recent`, dto);
  }
}
