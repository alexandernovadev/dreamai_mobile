/**
 * Signal hub sections — English UI copy. `listSlug` matches `/entity-list/[entity]` route.
 */
export const SIGNAL_ENTITY_SECTIONS = [
  { listSlug: 'characters', title: 'Characters' },
  { listSlug: 'locations', title: 'Locations' },
  { listSlug: 'objects', title: 'Objects' },
  { listSlug: 'events', title: 'Events' },
  { listSlug: 'life-context', title: 'Life context' },
  { listSlug: 'feelings', title: 'Feelings' },
] as const;

export type SignalEntityListSlug =
  (typeof SIGNAL_ENTITY_SECTIONS)[number]['listSlug'];
