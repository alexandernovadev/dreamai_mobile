import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DreamTab } from './DreamTabBar';
import type { DreamSession } from '@/services';
import { ENTITY_ACCENT, ENTITY_ICON } from './constants';
import type { EntitySectionDef } from './types';
import { DreamEntityCard } from './DreamEntityCard';
import { radius, spacing, typography } from '@/theme';

type DreamEntitySectionProps = {
  section: EntitySectionDef;
  session: DreamSession;
  cardWidth?: number;
  activeTab: DreamTab;
  returnToBase?: string;
};

export function DreamEntitySection({
  section,
  session,
  cardWidth,
  activeTab,
  returnToBase,
}: DreamEntitySectionProps) {
  const router = useRouter();
  const accent = ENTITY_ACCENT[section.slug];

  function goSignal(catalogId: string) {
    if (!catalogId) return;
    const fallback = `/dream/${session.id}${activeTab === 'elements' ? '?tab=elements' : ''}`;
    const base = returnToBase ?? fallback;
    const returnTo = encodeURIComponent(base);
    router.push(`/signals/${section.slug}/${catalogId}?returnTo=${returnTo}`);
  }

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.entitySectionBadge,
          { backgroundColor: accent.bg, borderColor: accent.border },
        ]}
      >
        <Ionicons
          name={ENTITY_ICON[section.slug]}
          size={16}
          color={accent.color}
        />
        <Text style={[styles.entitySectionTitle, { color: accent.color }]}>
          {section.title}
        </Text>
      </View>
      <View style={styles.entityList}>
        {section.rows.map((row) => (
          <DreamEntityCard
            key={row.id || row.primary}
            slug={section.slug}
            primary={row.primary}
            secondary={row.secondary}
            imageUri={row.imageUri}
            cardWidth={cardWidth}
            isPressable={!!row.id}
            onPress={() => goSignal(row.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  entitySectionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  entitySectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
