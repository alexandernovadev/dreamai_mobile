import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  /** Texto debajo del título */
  subtitle?: string;
  /**
   * Icono Ionicons que precede al subtítulo (variante tab-root).
   * Se ignora si también se pasa `onBack`.
   */
  subtitleIcon?: keyof typeof Ionicons.glyphMap;
  /** Si se provee, muestra el botón chevron-back a la izquierda (variante stack). */
  onBack?: () => void;
  /** Slot derecho — botón de acción opcional (ej. botón "Libro"). */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Header reutilizable para todas las pantallas.
 *
 * - **Variante tab** (`onBack` ausente): título hero + fila de subtítulo con icono.
 * - **Variante stack** (`onBack` presente): chevron + título (xxl) + subtítulo.
 */
export function ScreenHeader({
  title,
  subtitle,
  subtitleIcon,
  onBack,
  right,
  style,
}: Props) {
  const isStack = !!onBack;

  return (
    <View style={[sh.root, style]}>
      {isStack ? (
        /* ── Stack: [ ‹ ] [ título/subtítulo ] [ right? ] ── */
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={onBack}
            style={({ pressed }) => [sh.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={sh.stackText}>
            <Text style={sh.stackTitle}>{title}</Text>
            {subtitle ? (
              <Text style={sh.stackSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          {right ? <View style={sh.rightSlot}>{right}</View> : null}
        </>
      ) : (
        /* ── Tab root: [ título ] [ subtítulo con icono? ] [ right? ] ── */
        <>
          <View style={sh.tabMain}>
            <View style={sh.tabTextBlock}>
              <Text style={sh.tabTitle}>{title}</Text>
              {subtitle ? (
                <View style={sh.subtitleRow}>
                  {subtitleIcon ? (
                    <Ionicons name={subtitleIcon} size={14} color={colors.textMuted} />
                  ) : null}
                  <Text style={sh.tabSubtitle}>{subtitle}</Text>
                </View>
              ) : null}
            </View>
            {right ? <View style={sh.rightSlot}>{right}</View> : null}
          </View>
        </>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  root: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  /* ── Stack ── */
  backBtn: {
    marginLeft: -spacing.xs,
    padding: spacing.xs,
  },
  stackText: { flex: 1 },
  stackTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stackSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  /* ── Tab root ── */
  tabMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tabTextBlock: { flex: 1 },
  tabTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tabSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },

  /* ── Shared ── */
  rightSlot: {
    alignSelf: 'flex-start',
    paddingTop: spacing.xs,
  },
});
