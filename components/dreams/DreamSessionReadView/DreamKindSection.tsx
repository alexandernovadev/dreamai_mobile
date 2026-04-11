import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { KIND_VARIANTS } from "./constants";
import { dreamKindLabel } from "@/utils/dream";
import { colors, spacing, typography } from "@/theme";

type DreamKindSectionProps = {
  kinds: string[];
};

export function DreamKindSection({ kinds }: DreamKindSectionProps) {
  if (kinds.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tipo</Text>
      <View style={styles.chipRow}>
        {kinds.map((k, idx) => (
          <Chip
            key={k}
            label={dreamKindLabel(k)}
            variant={KIND_VARIANTS[idx % KIND_VARIANTS.length]}
            selected
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
