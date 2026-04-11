import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";

type DreamReflectionSectionProps = {
  userThought?: string;
  aiSummarize?: string;
};

export function DreamReflectionSection({
  userThought,
  aiSummarize,
}: DreamReflectionSectionProps) {
  const thought = userThought?.trim();
  const summary = aiSummarize?.trim();

  if (!thought && !summary) return null;

  return (
    <>
      {thought ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu reflexión</Text>
          <Text style={styles.bodyText}>{thought}</Text>
        </View>
      ) : null}

      {summary ? (
        <View style={[styles.section, styles.aiCard]}>
          <View style={styles.aiCardHead}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
            <Text style={styles.aiCardTitle}>Lectura DreamAI</Text>
          </View>
          <Text style={styles.bodyText}>{summary}</Text>
        </View>
      ) : null}
    </>
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
  bodyText: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
    color: colors.textSecondary,
    flex: 1,
  },
  aiCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 196, 0.28)",
    backgroundColor: "rgba(124, 92, 196, 0.08)",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  aiCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  aiCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
