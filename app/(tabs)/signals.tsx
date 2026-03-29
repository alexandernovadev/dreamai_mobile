import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, typography } from '@/theme';

export default function SignalsScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={s.root}
    >
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Text style={s.title}>Señales</Text>
          <View style={s.subtitleRow}>
            <Ionicons name="radio-outline" size={14} color={colors.textMuted} />
            <Text style={s.subtitle}>Patrones y símbolos recurrentes</Text>
          </View>
        </View>

        <View style={s.emptyCenter}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="analytics-outline" size={56} color={colors.accentMuted} />
          </View>
          <Text style={s.emptyTitle}>Sin señales aún</Text>
          <Text style={s.emptyDesc}>
            A medida que registres y refines tus sueños, aquí aparecerán personajes, objetos y lugares recurrentes.
          </Text>
          <View style={s.emptyChip}>
            <Ionicons name="construct-outline" size={14} color={colors.accent} />
            <Text style={s.emptyChipText}>Próximamente</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },

  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  emptyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.25)',
  },
  emptyChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.accent,
  },
});
