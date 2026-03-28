import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, typography } from '@/theme';

type Row = { href: '/more/alerts' | '/more/totem' | '/more/audio-cues' | '/more/catalog' | '/more/version'; label: string };

const ROWS: Row[] = [
  { href: '/more/alerts', label: 'Alerts' },
  { href: '/more/totem', label: 'Totem' },
  { href: '/more/audio-cues', label: 'Audio cues' },
  { href: '/more/catalog', label: 'Catalog' },
  { href: '/more/version', label: 'Version' },
];

export default function MoreScreen() {
  const router = useRouter();
  const bg = gradients.background;

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Settings and tools</Text>
        </View>
        <View style={styles.list}>
          {ROWS.map((row) => (
            <Pressable
              key={row.href}
              onPress={() => router.push(row.href)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  rowChevron: {
    fontSize: typography.sizes.xl,
    color: colors.textMuted,
  },
});
