import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { SignalHubCardItem } from '@/services/signalsHub';
import type { SignalEntityListSlug } from '@/services/signalEntities';
import { colors, radius, spacing, typography } from '@/theme';

const ICON: Record<SignalEntityListSlug, keyof typeof Ionicons.glyphMap> = {
  characters: 'person-outline',
  locations: 'location-outline',
  objects: 'cube-outline',
  events: 'flash-outline',
  'life-context': 'globe-outline',
  feelings: 'heart-outline',
};

type Props = {
  sectionSlug: SignalEntityListSlug;
  item: SignalHubCardItem;
};

/** Full-width row for catalog “See all” lists. */
export function EntityCatalogListRow({ sectionSlug, item }: Props) {
  const icon = ICON[sectionSlug];
  return (
    <View style={styles.row} accessibilityLabel={`${item.title}, ${item.appearanceCount} appearances`}>
      <View style={styles.thumb}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.thumbImg}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name={icon} size={28} color={colors.accentMuted} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta}>Appearances ×{item.appearanceCount}</Text>
      </View>
    </View>
  );
}

const THUMB = 56;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumbImg: {
    width: THUMB,
    height: THUMB,
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    lineHeight: 22,
  },
  meta: {
    marginTop: 2,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
