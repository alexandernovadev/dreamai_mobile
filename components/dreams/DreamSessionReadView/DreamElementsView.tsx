import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DreamSession } from '@/services';
import type { EntitySectionDef } from './types';
import { DreamEntitySection } from './DreamEntitySection';
import { colors, spacing, typography } from '@/theme';

type DreamElementsViewProps = {
  entitySections: EntitySectionDef[];
  session: DreamSession;
  entityGridWidth: number;
  entityColumns: number;
};

export function DreamElementsView({
  entitySections,
  session,
  entityGridWidth,
  entityColumns,
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
    <>
      {entitySections.map((sec) => (
        <DreamEntitySection
          key={sec.slug}
          section={sec}
          session={session}
          cardWidth={entityCardWidth}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
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
