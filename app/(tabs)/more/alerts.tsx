import { StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { colors, spacing, typography } from '@/theme';

export default function AlertsScreen() {
  return (
    <ScreenShell>
      <View style={styles.content}>
        <Text style={styles.body}>Alerts — coming soon.</Text>
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
