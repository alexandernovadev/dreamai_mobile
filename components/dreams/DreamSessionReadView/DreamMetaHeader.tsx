import { StyleSheet, Text, View } from "react-native";
import type { DreamSession } from "@/services";
import { STATUS_LABEL, STATUS_TONE } from "./constants";
import { formatDreamDateTime } from "@/utils/dream";
import { colors, radius, spacing, typography } from "@/theme";

type DreamMetaHeaderProps = {
  session: DreamSession;
};

export function DreamMetaHeader({ session }: DreamMetaHeaderProps) {
  const when = session.timestamp ?? session.createdAt;
  const dateLine = when ? formatDreamDateTime(when) : "Sin fecha";
  const tone = STATUS_TONE[session.status];

  return (
    <View style={styles.hero}>
      <Text style={styles.dateLine}>{dateLine}</Text>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: tone.bg, borderColor: tone.border },
        ]}
      >
        <Text style={[styles.statusText, { color: tone.text }]}>
          {STATUS_LABEL[session.status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm },
  dateLine: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textTransform: "capitalize",
    lineHeight: 26,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
