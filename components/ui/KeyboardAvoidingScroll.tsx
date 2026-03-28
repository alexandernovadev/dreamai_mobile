import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type KeyboardAvoidingScrollProps = ScrollViewProps & {
  children: ReactNode;
  /** Suma a `keyboardVerticalOffset` (p. ej. altura de header fijo). */
  keyboardOffset?: number;
};

/**
 * ScrollView dentro de KeyboardAvoidingView — útil en pantallas con Input / Textarea.
 * En Android suele combinarse con el ajuste del sistema; en iOS usa `padding`.
 */
export function KeyboardAvoidingScroll({
  children,
  keyboardOffset = 0,
  keyboardShouldPersistTaps = 'handled',
  ...scrollProps
}: KeyboardAvoidingScrollProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? insets.top + keyboardOffset : 0
      }
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
