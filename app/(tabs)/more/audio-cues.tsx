import { StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { colors, spacing, typography } from '@/theme';

export default function AudioCuesScreen() {
  return (
    <ScreenShell>
      <View style={styles.content}>
        <Text style={styles.body}>Audio cues — coming soon.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  body: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
