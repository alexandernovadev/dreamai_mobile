import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { contextLivesService } from '@/services';
import { Input, Modal, Textarea } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { CtxRow } from '../types';

export function ContextCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { title: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo contexto de la vida real"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = title.trim();
        if (!n) return;
        onSubmit({ title: n, description: description.trim() || undefined });
      }}
    >
      <Input label="Título" value={title} onChangeText={setTitle} />
      <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
    </Modal>
  );
}

export function ContextEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: CtxRow;
  onClose: () => void;
  onApplied: (next: CtxRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setTitle(row.title);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void contextLivesService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setTitle(x.title);
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
    const n = title.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await contextLivesService.update(row.id, { title: n, description: d });
        invalidateSignalsAfterCatalogWrite(queryClient, 'life-context', row.id);
        onApplied({ key: row.key, t: 'existing', id: row.id, title: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', title: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={
        row.t === 'existing'
          ? 'Editar contexto de la vida real'
          : 'Editar borrador (contexto de la vida real)'
      }
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
          <Input label="Título" value={title} onChangeText={setTitle} />
          <Textarea label="Descripción (opcional)" value={description} onChangeText={setDescription} />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xs },
});
