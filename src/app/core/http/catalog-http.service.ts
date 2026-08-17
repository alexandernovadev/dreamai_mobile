import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ENTITY_KIND_TO_API_PATH, type EntityKind } from '../../ui/dream/entity-kind';

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * One generic REST client for all 6 catalog entities (character/location/
 * dream-object/dream-event/feeling/context-life), mirroring
 * `catalog-base.controller.ts`'s verbs (`POST /`, `GET /:id`, `PATCH /:id`,
 * `DELETE /:id`). Methods take `kind` per call instead of the service being
 * generic-per-type — Angular DI can't resolve a distinct instance per type
 * parameter, and a stateless HTTP wrapper doesn't need one. This is what
 * keeps the frontend from reintroducing the old app's "6 near-duplicate
 * services" problem alongside the 6 near-duplicate forms.
 */
@Injectable({ providedIn: 'root' })
export class CatalogHttpService {
  private readonly http = inject(HttpClient);

  create<T>(kind: EntityKind, dto: Record<string, unknown>): Observable<T> {
    return this.http.post<T>(this.collectionUrl(kind), dto);
  }

  /**
   * List/search. NOTE: `findAll` on the backend uses Mongoose `.lean()`
   * queries, which skip the `id` virtual — rows come back with only `_id`,
   * unlike `create`/`findOne`/`update` which return hydrated documents with
   * both. Normalized to `id` here so every entity everywhere in the frontend
   * has one consistent shape.
   */
  findAll<T extends { id: string }>(
    kind: EntityKind,
    query: Record<string, string | number>,
  ): Observable<T[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== '' && value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return this.http
      .get<PaginatedResponse<Record<string, unknown> & { _id: string }>>(
        this.collectionUrl(kind),
        { params },
      )
      .pipe(
        map((res) =>
          res.data.map((row) => ({ ...row, id: row['_id'] }) as unknown as T),
        ),
      );
  }

  findOne<T>(kind: EntityKind, id: string): Observable<T> {
    return this.http.get<T>(this.itemUrl(kind, id));
  }

  update<T>(
    kind: EntityKind,
    id: string,
    dto: Record<string, unknown>,
  ): Observable<T> {
    return this.http.patch<T>(this.itemUrl(kind, id), dto);
  }

  remove(kind: EntityKind, id: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(kind, id));
  }

  private collectionUrl(kind: EntityKind): string {
    return `${environment.apiBaseUrl}/${ENTITY_KIND_TO_API_PATH[kind]}`;
  }

  private itemUrl(kind: EntityKind, id: string): string {
    return `${this.collectionUrl(kind)}/${id}`;
  }
}
