import { colors, radius, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/layout/ScreenShell';

type RowItem = {
  href:
    | '/more/alerts'
    | '/more/totem'
    | '/more/audio-cues'
    | '/more/catalog'
    | '/more/system-info';
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

const TOOLS: RowItem[] = [
  {
    href: '/more/system-info',
    label: 'Información del sistema',
    description: 'Versión del cliente, API y fechas de build',
    icon: 'information-circle-outline',
    iconColor: '#9CA3AF',
  },
  {
    href: '/more/alerts',
    label: 'Alertas',
    description: 'Recordatorios para registrar sueños',
    icon: 'notifications-outline',
    iconColor: '#F0C850',
  },
  {
    href: '/more/totem',
    label: 'Totem',
    description: 'Tu objeto de realidad onírica',
    icon: 'diamond-outline',
    iconColor: '#7C5CC4',
  },
  {
    href: '/more/audio-cues',
    label: 'Audio cues',
    description: 'Señales de audio durante el sueño',
    icon: 'volume-high-outline',
    iconColor: '#5B9CF6',
  },
];

const DEV: RowItem[] = [
  {
    href: '/more/catalog',
    label: 'Catálogo UI',
    description: 'Componentes del sistema de diseño',
    icon: 'color-palette-outline',
    iconColor: '#6DD47E',
  },
];

function RowCard({ item, onPress }: { item: RowItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
    >
      <View style={[s.rowIconWrap, { backgroundColor: item.iconColor + '1A' }]}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={s.rowContent}>
        <Text style={s.rowLabel}>{item.label}</Text>
        <Text style={s.rowDesc}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';
  const author =
    (Constants.expoConfig?.extra as { author?: string } | undefined)?.author ??
    'NovaLabs';

  return (
    <ScreenShell>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Más</Text>
            <View style={s.subtitleRow}>
              <Ionicons name="settings-outline" size={14} color={colors.textMuted} />
              <Text style={s.subtitle}>Herramientas y configuración</Text>
            </View>
          </View>

          {/* Tools section */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="build-outline" size={14} color={colors.accent} />
              <Text style={s.sectionTitle}>Herramientas</Text>
            </View>
            <View style={s.sectionList}>
              {TOOLS.map((item) => (
                <RowCard
                  key={item.href}
                  item={item}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </View>
          </View>

          {/* Dev section */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="code-slash-outline" size={14} color={colors.accent} />
              <Text style={s.sectionTitle}>Desarrollo</Text>
            </View>
            <View style={s.sectionList}>
              {DEV.map((item) => (
                <RowCard
                  key={item.href}
                  item={item}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed version footer */}
        <View style={[s.versionFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={s.versionLogo}
          />
          <Text style={s.versionText}>Dreamia v{version}</Text>
          <Text style={s.authorText}>Por {author}</Text>
        </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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

  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionList: {
    gap: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceMuted,
  },
  rowPressed: {
    opacity: 0.8,
    backgroundColor: colors.surface,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  rowDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },

  versionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  versionLogo: {
    width: 124,
    height: 124,
    borderRadius: 14,
    opacity: 0.7,
  },
  versionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  authorText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
