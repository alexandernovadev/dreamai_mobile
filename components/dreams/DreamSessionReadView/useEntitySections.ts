import { useMemo } from "react";
import type { DreamSession, DreamSessionHydratedMaps } from "@/services";
import { feelingKindLabel } from "@/utils/dream";
import type { EntitySectionDef } from "./types";
import { entityRefId } from "@/utils/entityRef";

type UseEntitySectionsProps = {
  session: DreamSession;
  hydrated: DreamSessionHydratedMaps;
};

export function useEntitySections({
  session,
  hydrated,
}: UseEntitySectionsProps): EntitySectionDef[] {
  return useMemo((): EntitySectionDef[] => {
    const ent = session.analysis?.entities;
    const out: EntitySectionDef[] = [];

    if (ent?.characters?.length) {
      const rows = ent.characters.map((r) => {
        const id = entityRefId(r.characterId) ?? "";
        const row = id ? hydrated.characters[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || "Personaje",
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: "Personajes", slug: "characters", rows });
    }

    if (ent?.locations?.length) {
      const rows = ent.locations.map((r) => {
        const id = entityRefId(r.locationId) ?? "";
        const row = id ? hydrated.locations[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || "Lugar",
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: "Lugares", slug: "locations", rows });
    }

    if (ent?.objects?.length) {
      const rows = ent.objects.map((r) => {
        const id = entityRefId(r.objectId) ?? "";
        const row = id ? hydrated.objects[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || "Objeto",
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: "Objetos", slug: "objects", rows });
    }

    if (ent?.events?.length) {
      const rows = ent.events.map((r) => {
        const id = entityRefId(r.eventId) ?? "";
        const row = id ? hydrated.events[id] : undefined;
        return {
          id,
          primary: row?.label?.trim() || "Evento",
          secondary: row?.description?.trim(),
        };
      });
      out.push({ title: "Eventos", slug: "events", rows });
    }

    if (ent?.contextLife?.length) {
      const rows = ent.contextLife.map((r) => {
        const id = entityRefId(r.contextLifeId) ?? "";
        const row = id ? hydrated.contextLife[id] : undefined;
        return {
          id,
          primary: row?.title?.trim() || "Contexto",
          secondary: row?.description?.trim(),
        };
      });
      out.push({ title: "Contexto de vida", slug: "life-context", rows });
    }

    if (ent?.feelings?.length) {
      const rows = ent.feelings.map((r) => {
        const id = entityRefId(r.feelingId) ?? "";
        const row = id ? hydrated.feelings[id] : undefined;
        const kindLabel = row?.kind
          ? feelingKindLabel(row.kind)
          : "Sentimiento";
        const extra =
          row?.intensity != null ? `Intensidad ${row.intensity}/10` : undefined;
        const notes = row?.notes?.trim();
        const secondary =
          [extra, notes].filter(Boolean).join(" · ") || undefined;
        return {
          id,
          primary: kindLabel,
          secondary,
        };
      });
      out.push({ title: "Emociones", slug: "feelings", rows });
    }

    return out;
  }, [session.analysis?.entities, hydrated]);
}
