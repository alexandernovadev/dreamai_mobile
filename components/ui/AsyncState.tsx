import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

export type AsyncStateProps = {
  loading?: boolean;
  loadingText?: string;
  error: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  /** Slot opcional para contenido custom (spinner o error). */
  children?: React.ReactNode;
};

/**
 * Estado asíncrono reutilizable: loading spinner + error con retry.
 * Cuando `loading` es true y no hay datos previos, muestra spinner.
 * Cuando `error` tiene valor, muestra error + botón reintentar.
 */
export function AsyncState({
  loading,
  loadingText = 'Cargando…',
  error,
  onRetry,
  retryLabel = 'Reintentar',
  children,
}: AsyncStateProps) {
  if (children) return <>{children}</>;

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.retryText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  retryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
