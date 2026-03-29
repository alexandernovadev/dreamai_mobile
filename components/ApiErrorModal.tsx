import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { colors, spacing, typography } from '@/theme';
import { apiErrors } from '@/services/apiErrors';

export function ApiErrorModal() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    return apiErrors.subscribe((msg) => {
      setMessage(msg);
      setVisible(true);
    });
  }, []);

  return (
    <Modal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Error de conexión"
      closeLabel="Entendido"
    >
      <Ionicons
        name="cloud-offline-outline"
        size={40}
        color={colors.danger}
        style={s.icon}
      />
      <Text style={s.message}>{message}</Text>
    </Modal>
  );
}

const s = StyleSheet.create({
  icon: { alignSelf: 'center' },
  message: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
