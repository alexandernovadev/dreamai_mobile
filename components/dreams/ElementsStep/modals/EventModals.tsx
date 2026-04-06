import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { dreamEventsService } from '@/services';
import { Input, Modal, Textarea } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { EventRow } from '../types';

export function EventCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { label: string; description?: string }) => void;
}) {
  const [label, setLabel] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo evento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = label.trim();
        if (!n) return;
        onSubmit({ label: n, description: description.trim() || undefined });
      }}
    >
      <Input label="Etiqueta" value={label} onChangeText={setLabel} />
      <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
    </Modal>
  );
}

export function EventEditModal({
  row,
  sessionId,
  onClose,
  onApplied,
  onApiError,
}: {
  row: EventRow;
  sessionId: string;
  onClose: () => void;
  onApplied: (next: EventRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setLabel(row.label);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void dreamEventsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setLabel(x.label);
        setDescription(x.description ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => { cancelled = true; };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = label.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await dreamEventsService.update(row.id, { label: n, description: d, dreamSessionId: sessionId });
        invalidateSignalsAfterCatalogWrite(queryClient, 'events', row.id);
        onApplied({ key: row.key, t: 'existing', id: row.id, label: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', label: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar evento' : 'Editar borrador (evento)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Etiqueta" value={label} onChangeText={setLabel} />
          <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xs },
});
