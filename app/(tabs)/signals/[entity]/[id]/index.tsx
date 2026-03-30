import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  charactersService,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  feelingsService,
  locationsService,
} from '@/services';
import { SIGNAL_ENTITY_SECTIONS, type SignalEntityListSlug } from '@/services/signalEntities';
import { colors, gradients, radius, spacing, typography } from '@/theme';

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

function feelingTitleEn(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

type DetailState =
  | { loading: true }
  | { loading: false; error: string }
  | {
      loading: false;
      title: string;
      subtitle?: string;
      imageUri?: string;
      appearanceCount: number;
    };

/** /signals/:entity/:id — catalog item detail. */
export default function SignalsCatalogDetailScreen() {
  const { entity, id } = useLocalSearchParams<{ entity: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const slug = (entity ?? '').toLowerCase();
  const rawId = (id ?? '').trim();
  const [state, setState] = useState<DetailState>({ loading: true });

  const load = useCallback(async () => {
    if (!isSignalSlug(slug) || !rawId) {
      setState({ loading: false, error: 'Invalid link' });
      return;
    }
    setState({ loading: true });
    try {
      switch (slug) {
        case 'characters': {
          const d = await charactersService.getOne(rawId);
          setState({
            loading: false,
            title: d.name,
            subtitle: d.description,
            imageUri: d.imageUri,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        case 'locations': {
          const d = await locationsService.getOne(rawId);
          setState({
            loading: false,
            title: d.name,
            subtitle: d.description,
            imageUri: d.imageUri,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        case 'objects': {
          const d = await dreamObjectsService.getOne(rawId);
          setState({
            loading: false,
            title: d.name,
            subtitle: d.description,
            imageUri: d.imageUri,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        case 'events': {
          const d = await dreamEventsService.getOne(rawId);
          setState({
            loading: false,
            title: d.label,
            subtitle: d.description,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        case 'life-context': {
          const d = await contextLivesService.getOne(rawId);
          setState({
            loading: false,
            title: d.title,
            subtitle: d.description,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        case 'feelings': {
          const d = await feelingsService.getOne(rawId);
          setState({
            loading: false,
            title: feelingTitleEn(d.kind),
            subtitle: d.notes,
            appearanceCount: d.dreamAppearances?.count ?? 0,
          });
          break;
        }
        default:
          setState({ loading: false, error: 'Unknown type' });
      }
    } catch (e) {
      setState({ loading: false, error: apiErrorMessage(e) });
    }
  }, [slug, rawId]);

  useEffect(() => {
    void load();
  }, [load]);

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

        {state.loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : 'error' in state && state.error ? (
          <Text style={styles.err}>{state.error}</Text>
        ) : state.loading === false && 'title' in state ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              {state.imageUri ? (
                <Image
                  source={{ uri: state.imageUri }}
                  style={styles.heroImg}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name="image-outline" size={48} color={colors.accentMuted} />
                </View>
              )}
            </View>
            <Text style={styles.title}>{state.title}</Text>
            {state.subtitle ? (
              <Text style={styles.desc}>{state.subtitle}</Text>
            ) : null}
            <Text style={styles.meta}>
              Appearances ×{state.appearanceCount}
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
