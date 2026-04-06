import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from '@/components/ui';
import type { ChipVariant } from '@/components/ui/Chip';
import { colors, radius, spacing, typography } from '@/theme';

type Entry = {
  key: string;
  label: string;
  onEdit?: () => void;
  chipVariant?: ChipVariant;
};

type Props = {
  title: string;
  chipVariant: ChipVariant;
  placeholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  suggestions: { id: string; label: string }[];
  loading: boolean;
  onPick: (id: string, label: string) => void;
  onCreate: () => void;
  entries: Entry[];
  onRemove: (key: string) => void;
  children?: React.ReactNode;
};

import { Input } from '@/components/ui';

export function SearchBlock({
  title,
  chipVariant,
  placeholder,
  query,
  onQueryChange,
  suggestions,
  loading,
  onPick,
  onCreate,
  entries,
  onRemove,
  children,
}: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Input
        placeholder={placeholder}
        value={query}
        onChangeText={onQueryChange}
        autoCapitalize="sentences"
        autoCorrect
      />
      {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      {suggestions.length > 0 ? (
        <View style={styles.sugBox}>
          {suggestions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onPick(s.id, s.label)}
              style={({ pressed }) => [styles.sugRow, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="link-outline" size={18} color={colors.textMuted} />
              <Text style={styles.sugText} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [styles.createLink, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
        <Text style={styles.createLinkText}>Crear nuevo…</Text>
      </Pressable>
      <View style={styles.chipRow}>
        {entries.map((e) => (
          <Chip
            key={e.key}
            label={e.label}
            variant={e.chipVariant ?? chipVariant}
            onEdit={e.onEdit}
            onRemove={() => onRemove(e.key)}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  loader: { marginVertical: spacing.xs },
  sugBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  sugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  sugText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  createLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  createLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
