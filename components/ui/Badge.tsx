import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  badgeGradients,
  badgeShineGradient,
  colors,
  typography,
  type BadgeVariant,
} from '@/theme';

const SIZES = {
  sm: 56,
  md: 72,
  lg: 88,
} as const;

const badgeOuterShadow: ViewStyle = Platform.select<ViewStyle>({
  web: {
    boxShadow: '0px 2px 8px rgba(255, 200, 96, 0.45)',
  },
  default: {
    shadowColor: '#ffc860',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
}) ?? {};

export type BadgeProps = {
  variant: BadgeVariant;
  size?: keyof typeof SIZES;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ variant, size = 'md', children, style }: BadgeProps) {
  const g = badgeGradients[variant];
  const shine = badgeShineGradient;
  const dim = SIZES[size];
  const r = dim / 2;

  return (
    <View
      style={[
        styles.outer,
        badgeOuterShadow,
        { width: dim, height: dim, borderRadius: r },
        style,
      ]}
    >
      <LinearGradient
        colors={[...g.colors]}
        start={g.start}
        end={g.end}
        style={[styles.fill, { borderRadius: r }]}
      />
      <LinearGradient
        colors={[...shine.colors]}
        start={shine.start}
        end={shine.end}
        style={[styles.fill, styles.shine, { borderRadius: r }]}
      />
      {children ? (
        <View style={styles.content} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 210, 130, 0.75)',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  shine: {
    opacity: 0.85,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Estilo sugerido para texto / emoji dentro del badge. */
export const badgeLabelStyle = {
  color: colors.textInverse,
  fontSize: 30,
  fontWeight: typography.weights.bold,
  textShadowColor: 'rgba(0, 0, 0, 0.4)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
} as const;
