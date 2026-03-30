import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { apiErrorMessage } from '@/services/api';
import {
  fetchSignalsCatalogEntity,
  mapSignalsCatalogEntityToDetail,
} from '@/lib/signalsCatalogEntity';
import { queryKeys } from '@/lib/queryKeys';
import { SIGNAL_ENTITY_SECTIONS, type SignalEntityListSlug } from '@/services/signalEntities';
import { colors, gradients, radius, spacing, typography } from '@/theme';

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

/** /signals/:entity/:id — catalog item detail. */
export default function SignalsCatalogDetailScreen() {
  const { entity, id } = useLocalSearchParams<{ entity: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const slug = (entity ?? '').toLowerCase();
  const rawId = (id ?? '').trim();
  const slugOk = isSignalSlug(slug) && !!rawId;

  const detailQuery = useQuery({
    queryKey: queryKeys.signals.catalogDetail(
      slug as SignalEntityListSlug,
      rawId,
    ),
    queryFn: () =>
      fetchSignalsCatalogEntity(slug as SignalEntityListSlug, rawId),
    enabled: slugOk,
  });

  const view =
    detailQuery.data != null
      ? mapSignalsCatalogEntityToDetail(detailQuery.data)
      : null;

  const err =
    !slugOk
      ? 'Invalid link'
      : detailQuery.error
        ? apiErrorMessage(detailQuery.error)
        : null;

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Detail
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit"
            onPress={() => router.push(`/signals/${slug}/${rawId}/edit`)}
            style={({ pressed }) => [styles.editIcon, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="create-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>

        {detailQuery.isPending && slugOk ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : err ? (
          <Text style={styles.err}>{err}</Text>
        ) : view ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              {view.imageUri ? (
                <Image
                  source={{ uri: view.imageUri }}
                  style={styles.heroImg}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name="image-outline" size={48} color={colors.accentMuted} />
                </View>
              )}
            </View>
            <Text style={styles.title}>{view.title}</Text>
            {view.subtitle ? (
              <Text style={styles.desc}>{view.subtitle}</Text>
            ) : null}
            <Text style={styles.meta}>
              Appearances ×{view.appearanceCount}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/signals/${slug}/${rawId}/edit`)}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  editIcon: {
    width: 40,
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  screenTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl, gap: spacing.md },
  hero: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  desc: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  err: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  editBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  editBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
