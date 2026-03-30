import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  buttonDarkLabelVariants,
  buttonGradients,
  colors,
  radius,
  spacing,
  typography,
  type ButtonGradientVariant,
  type ButtonVariant,
} from '@/theme';

const darkLabelSet = new Set<ButtonGradientVariant>([...buttonDarkLabelVariants]);

/** Web deprecates shadow*; native keeps iOS/Android shadows. */
const glowOuterElevation: ViewStyle = Platform.select<ViewStyle>({
  web: {
    boxShadow: '0 0 8px rgba(61, 40, 104, 0.35)',
  },
  default: {
    shadowColor: colors.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
}) ?? {};

const SPRING = { damping: 20, stiffness: 420, mass: 0.28 } as const;
const PRESSED_SCALE = 0.98;
const PRESSED_TRANSLATE_Y = 2;

type Props = Omit<PressableProps, 'children'> & {
  children: string;
  variant?: ButtonVariant;
  compact?: boolean;
  /** Muestra spinner y texto de carga dentro del botón; equivale a deshabilitado. */
  loading?: boolean;
  /** Texto junto al spinner cuando `loading` es true (p. ej. contexto distinto al borrador). */
  loadingLabel?: string;
  /** Icono u otro nodo antes del texto (solo cuando no está en carga). */
  iconStart?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = 'yellow',
  compact = false,
  loading = false,
  loadingLabel = 'Analizando narrativa…',
  iconStart,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...pressableProps
}: Props) {
  const isOutline = variant === 'outline';
  const g = isOutline ? null : buttonGradients[variant];
  const isDisabled = Boolean(disabled || loading);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      onPressIn?.(e);
      if (isDisabled) return;
      scale.value = withSpring(PRESSED_SCALE, SPRING);
      translateY.value = withSpring(PRESSED_TRANSLATE_Y, SPRING);
    },
    [isDisabled, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      onPressOut?.(e);
      scale.value = withSpring(1, SPRING);
      translateY.value = withSpring(0, SPRING);
    },
    [onPressOut]
  );

  const spinnerColor = isOutline
    ? colors.accent
    : darkLabelSet.has(variant as ButtonGradientVariant)
      ? colors.text
      : colors.buttonLabel;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={null}
      {...pressableProps}
      style={[isDisabled && styles.disabled, style]}
    >
      <Animated.View
        style={[
          styles.glowOuter,
          !isOutline && glowOuterElevation,
          animatedStyle,
        ]}
      >
        {isOutline ? (
          <View
            style={[
              styles.outlineInner,
              compact && styles.outlineInnerCompact,
              (loading || Boolean(iconStart)) && styles.innerRow,
            ]}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={spinnerColor} />
                <Text
                  style={[
                    styles.label,
                    compact && styles.labelCompact,
                    styles.labelOutline,
                  ]}
                >
                  {loadingLabel}
                </Text>
              </>
            ) : iconStart ? (
              <>
                {iconStart}
                <Text
                  style={[
                    styles.label,
                    compact && styles.labelCompact,
                    styles.labelOutline,
                  ]}
                >
                  {children}
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  styles.labelOutline,
                ]}
              >
                {children}
              </Text>
            )}
          </View>
        ) : (
          g && (
            <View style={styles.innerBorder}>
              <LinearGradient
                colors={[...g.colors]}
                start={g.start}
                end={g.end}
                style={[
                  styles.gradient,
                  compact && styles.gradientCompact,
                  (loading || Boolean(iconStart)) && styles.innerRow,
                ]}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color={spinnerColor} />
                    <Text
                      style={[
                        styles.label,
                        compact && styles.labelCompact,
                        darkLabelSet.has(variant as ButtonGradientVariant) &&
                          styles.labelOnDark,
                      ]}
                    >
                      {loadingLabel}
                    </Text>
                  </>
                ) : iconStart ? (
                  <>
                    {iconStart}
                    <Text
                      style={[
                        styles.label,
                        compact && styles.labelCompact,
                        darkLabelSet.has(variant as ButtonGradientVariant) &&
                          styles.labelOnDark,
                      ]}
                    >
                      {children}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.label,
                      compact && styles.labelCompact,
                      darkLabelSet.has(variant as ButtonGradientVariant) &&
                        styles.labelOnDark,
                    ]}
                  >
                    {children}
                  </Text>
                )}
              </LinearGradient>
            </View>
          )
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    borderRadius: radius.lg,
  },
  innerBorder: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.45,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  gradientCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  label: {
    color: colors.buttonLabel,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: typography.sizes.sm,
  },
  labelOnDark: {
    color: colors.text,
  },
  outlineInner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonOutlineBorder,
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  outlineInnerCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  labelOutline: {
    color: colors.text,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
