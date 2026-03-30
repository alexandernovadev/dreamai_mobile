import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography } from '@/theme';

export default function DreamDetailScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          <Text style={s.placeholder}>Detalle de sueño — en desarrollo</Text>
          </View>
          </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  backBtn: { marginTop: spacing.sm, padding: spacing.xs, alignSelf: 'flex-start' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
