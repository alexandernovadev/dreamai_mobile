import type { ReactNode } from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '@/theme';

export type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Texto del botón principal (cierra el modal). */
  closeLabel?: string;
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  closeLabel = 'Cerrar',
}: ModalProps) {
  const insets = useSafeAreaInsets();

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
          <View style={styles.body}>{children}</View>
          <Button variant="purple" onPress={onClose}>
            {closeLabel}
          </Button>
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
});
