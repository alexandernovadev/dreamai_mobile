import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography } from '@/theme';

export default function DreamsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Dreams</Text>
        <Text style={styles.subtitle}>Your dreams will appear here.</Text>

        <FlatList
          data={[]}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No dreams yet</Text>
              <Text style={styles.emptyHint}>
                Tap + to capture your first dream.
              </Text>
            </View>
          }
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add dream"
          onPress={() => router.push('/dreams/add')}
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + spacing.lg },
            pressed && styles.fabPressed,
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge,
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.9,
  },
});
