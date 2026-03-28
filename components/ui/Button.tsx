import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import {
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
} from '@/theme';

const darkLabelSet = new Set<ButtonGradientVariant>([...buttonDarkLabelVariants]);

const SPRING = { damping: 20, stiffness: 420, mass: 0.28 } as const;
const PRESSED_SCALE = 0.98;
const PRESSED_TRANSLATE_Y = 2;

type Props = Omit<PressableProps, 'children'> & {
  children: string;
  variant?: ButtonGradientVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = 'yellow',
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...pressableProps
}: Props) {
  const g = buttonGradients[variant];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      onPressIn?.(e);
      if (disabled) return;
      scale.value = withSpring(PRESSED_SCALE, SPRING);
      translateY.value = withSpring(PRESSED_TRANSLATE_Y, SPRING);
    },
    [disabled, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      onPressOut?.(e);
      scale.value = withSpring(1, SPRING);
      translateY.value = withSpring(0, SPRING);
    },
    [onPressOut]
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={null}
      {...pressableProps}
      style={[disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.glowOuter, animatedStyle]}>
        <View style={styles.innerBorder}>
          <LinearGradient
            colors={[...g.colors]}
            start={g.start}
            end={g.end}
            style={styles.gradient}
          >
            <Text
              style={[
                styles.label,
                darkLabelSet.has(variant) && styles.labelOnDark,
              ]}
            >
              {children}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    borderRadius: radius.lg,
    shadowColor: colors.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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
  label: {
    color: colors.buttonLabel,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.3,
  },
  labelOnDark: {
    color: colors.text,
  },
});
