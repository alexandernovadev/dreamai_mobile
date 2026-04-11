import type { SignalEntityListSlug } from "@/services/signalEntities";

export type EntitySectionDef = {
  title: string;
  slug: SignalEntityListSlug;
  rows: {
    id: string;
    primary: string;
    secondary?: string;
    imageUri?: string;
  }[];
};
