import { useState } from "react";
import { useWindowDimensions, View, StyleSheet } from "react-native";
import type { DreamSession, DreamSessionHydratedMaps } from "@/services";
import { DreamTabBar, type DreamTab } from "./DreamTabBar";
import { DreamDreamView } from "./DreamDreamView";
import { DreamElementsView } from "./DreamElementsView";
import { useEntitySections } from "./useEntitySections";
import { spacing } from "@/theme";

export type DreamSessionReadViewProps = {
  session: DreamSession;
  hydrated: DreamSessionHydratedMaps;
};

export function DreamSessionReadView({
  session,
  hydrated,
}: DreamSessionReadViewProps) {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<DreamTab>("dream");

  const entitySections = useEntitySections({ session, hydrated });
  const entityGridWidth = Math.max(width - spacing.sm * 2, 0);
  const entityColumns = Math.max(
    1,
    Math.min(5, Math.floor(entityGridWidth / 140)),
  );

  return (
    <View style={styles.root}>
      <DreamTabBar activeTab={tab} onTabPress={setTab} />

      {tab === "dream" ? (
        <DreamDreamView session={session} />
      ) : (
        <DreamElementsView
          entitySections={entitySections}
          session={session}
          entityGridWidth={entityGridWidth}
          entityColumns={entityColumns}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
