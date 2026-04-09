import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '@/theme';

type Props = {
  children: ReactNode;
  /**
   * Extra styles applied to the inner safe-area View.
   * Useful for per-screen paddingHorizontal, paddingBottom, etc.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Root shell for every full-screen page.
 * Renders the shared background gradient and applies `paddingTop` from
 * the top safe-area inset so screens don't need to repeat this boilerplate.
 */
export function ScreenShell({ children, style }: Props) {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={ss.root}
    >
      <View style={[ss.inner, { paddingTop: insets.top }, style]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
