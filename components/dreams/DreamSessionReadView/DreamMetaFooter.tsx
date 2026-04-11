import { StyleSheet, Text, View } from "react-native";
import type { DreamSession } from "@/services";
import { formatMetaDate } from "@/utils/dream";
import { colors, spacing, typography } from "@/theme";

type DreamMetaFooterProps = {
  session: DreamSession;
};

export function DreamMetaFooter({ session }: DreamMetaFooterProps) {
  const hasCreated = !!session.createdAt;
  const hasUpdated =
    !!session.updatedAt &&
    !!session.createdAt &&
    session.updatedAt.getTime() !== session.createdAt.getTime();

  if (!hasCreated && !hasUpdated) return null;

  return (
    <View style={styles.metaFoot}>
      {hasCreated ? (
        <Text style={styles.metaText}>
          Registrado {formatMetaDate(session.createdAt!)}
        </Text>
      ) : null}
      {hasUpdated ? (
        <Text style={styles.metaText}>
          Actualizado {formatMetaDate(session.updatedAt!)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metaFoot: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
