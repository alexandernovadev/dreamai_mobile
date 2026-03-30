/** Returned by catalog `GET /:id` when crossing with dream_sessions.entities. */
export type DreamAppearances = {
  count: number;
  dreams?: { _id: string; timestamp: string | null }[];
};
