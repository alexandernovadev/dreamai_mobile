import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { dreamObjectsService } from '@/services';
import { Input, Modal, Textarea } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { ObjRow } from '../types';

export function ObjectCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo objeto"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        if (!n) return;
        onSubmit({ name: n, description: description.trim() || undefined });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
    </Modal>
  );
}

export function ObjectEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: ObjRow;
  onClose: () => void;
  onApplied: (next: ObjRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void dreamObjectsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setName(x.name);
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
    const n = name.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await dreamObjectsService.update(row.id, { name: n, description: d });
        invalidateSignalsAfterCatalogWrite(queryClient, 'objects', row.id);
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', name: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar objeto' : 'Editar borrador (objeto)'}
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
          <Input label="Nombre" value={name} onChangeText={setName} />
          <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xs },
});
