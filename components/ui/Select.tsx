import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/theme';
import { formFieldStyles } from './formFieldStyles';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  modalTitle?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Select({
  label,
  error,
  hint,
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar…',
  disabled = false,
  modalTitle = 'Seleccionar',
  containerStyle,
}: SelectProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? null;
  }, [options, value]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const openSheet = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [disabled]);

  const onPick = useCallback(
    (v: string) => {
      onValueChange(v);
      void Haptics.selectionAsync();
      close();
    },
    [onValueChange, close]
  );

  const renderItem: ListRenderItem<SelectOption> = useCallback(
    ({ item }) => {
      const selected = item.value === value;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => onPick(item.value)}
          style={({ pressed }) => [
            styles.optionRow,
            selected && styles.optionRowSelected,
            pressed && styles.optionRowPressed,
          ]}
        >
          <Text
            style={[styles.optionLabel, selected && styles.optionLabelSelected]}
          >
            {item.label}
          </Text>
          {selected ? (
            <Ionicons name="checkmark" size={22} color={colors.accent} />
          ) : null}
        </Pressable>
      );
    },
    [value, onPick]
  );

  const a11yLabel = label ?? placeholder;

  return (
    <View style={[formFieldStyles.container, containerStyle]}>
      {label ? (
        <Text style={formFieldStyles.label} nativeID={`${label}-select-label`}>
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint="Abre la lista de opciones"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          open && !error && formFieldStyles.focused,
          !!error && formFieldStyles.errorBorder,
          disabled && formFieldStyles.disabled,
          pressed && !disabled && styles.triggerPressed,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedLabel && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </Pressable>

      {error ? <Text style={formFieldStyles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={formFieldStyles.hint}>{hint}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityLabel="Cerrar"
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              nestedScrollEnabled
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  triggerPlaceholder: {
    color: colors.textMuted,
  },
  chevron: {
    flexShrink: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.buttonBorder,
    maxHeight: '70%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 320,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  optionLabelSelected: {
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
