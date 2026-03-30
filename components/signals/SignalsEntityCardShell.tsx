import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradients, radius, spacing, typography } from '@/theme';

const CARD_WIDTH = 168;

/** Placeholder card — image slot + skeleton lines. No API (step 1). */
export function SignalsEntityCardShell() {
  const sk = gradients.skeleton;
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <LinearGradient
          colors={[...sk.colors]}
          start={sk.start}
          end={sk.end}
          style={styles.imagePlaceholder}
        />
      </View>
      <View style={styles.body}>
        <LinearGradient
          colors={[...sk.colors]}
          start={sk.start}
          end={sk.end}
          style={styles.lineLg}
        />
        <LinearGradient
          colors={[...sk.colors]}
          start={sk.start}
          end={sk.end}
          style={styles.lineSm}
        />
        <Text style={styles.appearances}>Appearances ×—</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  lineLg: {
    height: 12,
    borderRadius: radius.sm,
    width: '88%',
  },
  lineSm: {
    height: 10,
    borderRadius: radius.sm,
    width: '55%',
  },
  appearances: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
});
