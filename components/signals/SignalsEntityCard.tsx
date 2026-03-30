import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { SignalHubCardItem } from '@/services/signalsHub';
import type { SignalEntityListSlug } from '@/services/signalEntities';
import { colors, radius, spacing, typography } from '@/theme';

const CARD_WIDTH = 168;

const PLACEHOLDER_ICON: Record<
  SignalEntityListSlug,
  keyof typeof Ionicons.glyphMap
> = {
  characters: 'person',
  locations: 'location',
  objects: 'cube-outline',
  events: 'flash-outline',
  'life-context': 'globe-outline',
  feelings: 'heart-outline',
};

type Props = {
  sectionSlug: SignalEntityListSlug;
  item: SignalHubCardItem;
};

export function SignalsEntityCard({ sectionSlug, item }: Props) {
  const icon = PLACEHOLDER_ICON[sectionSlug];
  return (
    <View style={styles.card} accessibilityLabel={`${item.title}, ${item.appearanceCount} appearances`}>
      <View style={styles.imageWrap}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name={icon} size={40} color={colors.accentMuted} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.appearances}>
          Appearances ×{item.appearanceCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.md,
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
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    lineHeight: 20,
  },
  appearances: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
});
