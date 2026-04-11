import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/theme';

type DreamNarrativeProps = {
  text: string;
};

export function DreamNarrative({ text }: DreamNarrativeProps) {
  if (text.trim().length === 0) {
    return (
      <Text style={styles.mutedBlock}>Sin narrativa registrada.</Text>
    );
  }

  return <Text style={styles.narrative}>{text.trim()}</Text>;
}

const styles = StyleSheet.create({
  narrative: {
    fontSize: typography.sizes.md,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  mutedBlock: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
