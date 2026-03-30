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

/** Compact grid cell for “See all” /signals/:entity (5 per row). */
export function EntityCatalogGridItem({ sectionSlug, item }: Props) {
  const icon = ICON[sectionSlug];
  return (
    <View
      style={styles.cell}
      accessibilityLabel={`${item.title}, ${item.appearanceCount} appearances`}
    >
      <View style={styles.imageWrap}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name={icon} size={22} color={colors.accentMuted} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        ×{item.appearanceCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '100%',
    borderRadius: radius.sm,
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
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    lineHeight: 14,
  },
  meta: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    paddingTop: 2,
    fontSize: 10,
    color: colors.textMuted,
  },
});
