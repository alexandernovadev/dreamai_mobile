import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DreamTab } from './DreamTabBar';
import type { DreamSession } from '@/services';
import type { EntitySectionDef } from './types';
import { DreamEntitySection } from './DreamEntitySection';
import { colors, spacing, typography } from '@/theme';

type DreamElementsViewProps = {
  entitySections: EntitySectionDef[];
  session: DreamSession;
  entityGridWidth: number;
  entityColumns: number;
  activeTab: DreamTab;
  returnToBase?: string;
};

export function DreamElementsView({
  entitySections,
  session,
  entityGridWidth,
  entityColumns,
  activeTab,
  returnToBase,
}: DreamElementsViewProps) {
  const entityCardWidth =
    entityColumns > 1
      ? Math.max(
          (entityGridWidth - spacing.sm * Math.max(entityColumns - 1, 0)) /
            entityColumns,
          0,
        )
      : undefined;

  const hasAnyEntity = entitySections.some((s) => s.rows.length > 0);

  if (!hasAnyEntity) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="link-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin elementos vinculados</Text>
        <Text style={styles.emptyHint}>
          Las entidades del catálogo (personajes, lugares, etc.) aparecen aquí
          cuando las asocies en el editor del sueño.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {entitySections.map((sec) => (
        <DreamEntitySection
          key={sec.slug}
          section={sec}
          session={session}
          cardWidth={entityCardWidth}
          activeTab={activeTab}
          returnToBase={returnToBase}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
