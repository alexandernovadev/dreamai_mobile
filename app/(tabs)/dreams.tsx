import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing, typography } from '@/theme';

export default function DreamsScreen() {
  const bg = gradients.background;
  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.title}>Dreams</Text>
          <Text style={styles.subtitle}>Your dream list — coming soon.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
