import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography } from '@/theme';

/**
 * Vista de sueño por id: `/dream/:id` (solo lectura / resumen).
 * El formulario compartido está en `/dream/edit/:id`.
 */
export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const raw = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const bg = gradients.background;
  const insets = useSafeAreaInsets();

  if (!raw) {
    return null;
  }

  if (raw === 'edit' || raw === 'new') {
    return <Redirect href="/dream" />;
  }

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={s.root}
    >
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>

        <View style={s.center}>
          <Text style={s.idLabel}>Sueño</Text>
          <Text style={s.idMono} selectable>
            {raw}
          </Text>
          <Text style={s.placeholder}>Vista detalle — próximamente</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/dream/edit/[id]', params: { id: raw } })
            }
            style={({ pressed }) => [s.editLink, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={s.editLinkText}>Ir a editar</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  backBtn: { marginTop: spacing.sm, padding: spacing.xs, alignSelf: 'flex-start' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  idLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  idMono: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  placeholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.35)',
    backgroundColor: 'rgba(124, 92, 196, 0.1)',
  },
  editLinkText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
