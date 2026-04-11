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
  activeTab: DreamTab;
  onTabChange: (tab: DreamTab) => void;
  /** Ruta a donde volver al pulsar "back" desde signals. */
  returnToBase?: string;
};

export function DreamSessionReadView({
  session,
  hydrated,
  activeTab,
  onTabChange,
  returnToBase,
}: DreamSessionReadViewProps) {
  const { width } = useWindowDimensions();

  const entitySections = useEntitySections({ session, hydrated });
  const entityGridWidth = Math.max(width - spacing.sm * 2, 0);
  const entityColumns = Math.max(
    1,
    Math.min(5, Math.floor(entityGridWidth / 140)),
  );

  return (
    <View style={styles.root}>
      <DreamTabBar activeTab={activeTab} onTabPress={onTabChange} />

      {activeTab === "dream" ? (
        <DreamDreamView session={session} />
      ) : (
        <DreamElementsView
          entitySections={entitySections}
          session={session}
          entityGridWidth={entityGridWidth}
          entityColumns={entityColumns}
          activeTab={activeTab}
          returnToBase={returnToBase}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
