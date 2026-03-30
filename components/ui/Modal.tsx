import type { ReactNode } from 'react';
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '@/theme';

export type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeLabel?: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  closeLabel = 'Cerrar',
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bodyMaxHeight = Math.round(windowHeight * 0.52);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Cerrar modal"
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView
            style={{ maxHeight: bodyMaxHeight }}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>
          {primaryLabel != null && onPrimaryPress != null ? (
            <View style={styles.footerRow}>
              <Button
                variant="outline"
                compact
                onPress={onClose}
                style={styles.footerBtn}
              >
                {closeLabel}
              </Button>
              <Button
                variant="purple"
                compact
                disabled={primaryDisabled}
                onPress={onPrimaryPress}
                style={styles.footerBtn}
              >
                {primaryLabel}
              </Button>
            </View>
          ) : (
            <Button variant="purple" onPress={onClose}>
              {closeLabel}
            </Button>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  body: {
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
    minWidth: 100,
  },
});
