import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { SignalEntityListSlug } from '@/services/signalEntities';
import { ENTITY_ICON } from './constants';
import { colors, radius, spacing, typography } from '@/theme';

type DreamEntityCardProps = {
  slug: SignalEntityListSlug;
  primary: string;
  secondary?: string;
  imageUri?: string;
  cardWidth?: number;
  isPressable: boolean;
  onPress: () => void;
};

export function DreamEntityCard({
  slug,
  primary,
  secondary,
  imageUri,
  cardWidth,
  isPressable,
  onPress,
}: DreamEntityCardProps) {
  const iconName = ENTITY_ICON[slug];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!isPressable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.entityRow,
        cardWidth != null && { width: cardWidth },
        !isPressable && styles.entityRowDisabled,
        pressed && isPressable && { opacity: 0.85 },
      ]}
    >
      <View style={styles.entityMedia}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.entityImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.entityImagePlaceholder}>
            <Ionicons name={iconName} size={22} color={colors.accentMuted} />
          </View>
        )}
      </View>
      <View style={styles.entityText}>
        <Text style={styles.entityPrimary} numberOfLines={2}>
          {primary}
        </Text>
        {secondary ? (
          <Text style={styles.entitySecondary} numberOfLines={2}>
            {secondary}
          </Text>
        ) : null}
      </View>
      {isPressable ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  entityRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: spacing.sm,
  },
  entityRowDisabled: { opacity: 0.6 },
  entityMedia: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  entityImage: {
    width: '100%',
    height: '100%',
  },
  entityImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityText: { flex: 1, gap: 4 },
  entityPrimary: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  entitySecondary: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
