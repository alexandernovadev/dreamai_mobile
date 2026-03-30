import {
  charactersService,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  feelingsService,
  locationsService,
} from '@/services';
import type { DreamAppearances } from '@/services/dreamAppearances';
import type { SignalEntityListSlug } from '@/services/signalEntities';

export type SignalsCatalogDetailView = {
  title: string;
  subtitle?: string;
  imageUri?: string;
  appearanceCount: number;
  /** Cada ítem es un sueño donde aparece la entidad. */
  dreamSessions: { id: string; timestamp: string | null }[];
};

/** One catalog row from `getOne` + slug (shared cache for detail + edit). */
export type SignalsCatalogEntity =
  | {
      slug: 'characters';
      data: Awaited<ReturnType<typeof charactersService.getOne>>;
    }
  | {
      slug: 'locations';
      data: Awaited<ReturnType<typeof locationsService.getOne>>;
    }
  | {
      slug: 'objects';
      data: Awaited<ReturnType<typeof dreamObjectsService.getOne>>;
    }
  | {
      slug: 'events';
      data: Awaited<ReturnType<typeof dreamEventsService.getOne>>;
    }
  | {
      slug: 'life-context';
      data: Awaited<ReturnType<typeof contextLivesService.getOne>>;
    }
  | {
      slug: 'feelings';
      data: Awaited<ReturnType<typeof feelingsService.getOne>>;
    };

export async function fetchSignalsCatalogEntity(
  slug: SignalEntityListSlug,
  id: string,
): Promise<SignalsCatalogEntity> {
  switch (slug) {
    case 'characters': {
      const data = await charactersService.getOne(id);
      return { slug: 'characters', data };
    }
    case 'locations': {
      const data = await locationsService.getOne(id);
      return { slug: 'locations', data };
    }
    case 'objects': {
      const data = await dreamObjectsService.getOne(id);
      return { slug: 'objects', data };
    }
    case 'events': {
      const data = await dreamEventsService.getOne(id);
      return { slug: 'events', data };
    }
    case 'life-context': {
      const data = await contextLivesService.getOne(id);
      return { slug: 'life-context', data };
    }
    case 'feelings': {
      const data = await feelingsService.getOne(id);
      return { slug: 'feelings', data };
    }
  }
}

function feelingTitleEn(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function dreamSessionsFrom(d: { dreamAppearances?: DreamAppearances }) {
  return (d.dreamAppearances?.dreams ?? []).map((x) => ({
    id: x._id,
    timestamp: x.timestamp ?? null,
  }));
}

export function mapSignalsCatalogEntityToDetail(
  row: SignalsCatalogEntity,
): SignalsCatalogDetailView {
  const ac = (d: { dreamAppearances?: { count?: number } }) =>
    d.dreamAppearances?.count ?? 0;
  switch (row.slug) {
    case 'characters':
    case 'locations':
    case 'objects':
      return {
        title: row.data.name,
        subtitle: row.data.description,
        imageUri: row.data.imageUri,
        appearanceCount: ac(row.data),
        dreamSessions: dreamSessionsFrom(row.data),
      };
    case 'events':
      return {
        title: row.data.label,
        subtitle: row.data.description,
        appearanceCount: ac(row.data),
        dreamSessions: dreamSessionsFrom(row.data),
      };
    case 'life-context':
      return {
        title: row.data.title,
        subtitle: row.data.description,
        appearanceCount: ac(row.data),
        dreamSessions: dreamSessionsFrom(row.data),
      };
    case 'feelings':
      return {
        title: feelingTitleEn(row.data.kind),
        subtitle: row.data.notes,
        appearanceCount: ac(row.data),
        dreamSessions: dreamSessionsFrom(row.data),
      };
  }
}
