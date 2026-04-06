import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  CHARACTER_ARCHETYPE_OPTIONS,
  type CharacterArchetype,
  charactersService,
} from '@/services';
import type { SelectOption } from '@/components/ui';
import { Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { CharRow } from '../types';

const ARCHETYPE_SELECT: SelectOption[] = CHARACTER_ARCHETYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function CharacterCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: {
    name: string;
    description: string;
    isKnown: boolean;
    archetype: CharacterArchetype;
  }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');
  const [isKnown, setIsKnown] = useState(false);
  const [archetype, setArchetype] = useState<CharacterArchetype | null>('UNKNOWN');

  return (
    <Modal
      visible={true}
      title="Nuevo personaje"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        const d = description.trim();
        if (!n || !d || !archetype) return;
        onSubmit({ name: n, description: d, isKnown, archetype });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea label="Descripción" value={description} onChangeText={setDescription} />
      <Switch label="¿Te es conocido en la vida real?" value={isKnown} onValueChange={setIsKnown} />
      <Select
        label="Arquetipo"
        options={ARCHETYPE_SELECT}
        value={archetype}
        onValueChange={(v) => setArchetype(v as CharacterArchetype)}
        placeholder="Arquetipo"
        modalTitle="Arquetipo"
      />
    </Modal>
  );
}

export function CharacterEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: CharRow;
  onClose: () => void;
  onApplied: (next: CharRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isKnown, setIsKnown] = useState(false);
  const [archetype, setArchetype] = useState<CharacterArchetype | null>(null);

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description);
      setIsKnown(row.isKnown);
      setArchetype(row.archetype);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void charactersService
      .getOne(row.id)
      .then((c) => {
        if (cancelled) return;
        setName(c.name);
        setDescription(c.description);
        setIsKnown(c.isKnown);
        setArchetype(c.archetype);
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
    const d = description.trim();
    if (!n || !d || !archetype) return;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await charactersService.update(row.id, { name: n, description: d, isKnown, archetype });
        invalidateSignalsAfterCatalogWrite(queryClient, 'characters', row.id);
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', name: n, description: d, isKnown, archetype });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar personaje' : 'Editar borrador (personaje)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving || !archetype}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Nombre" value={name} onChangeText={setName} />
          <Textarea label="Descripción" value={description} onChangeText={setDescription} />
          <Switch label="¿Te es conocido en la vida real?" value={isKnown} onValueChange={setIsKnown} />
          <Select
            label="Arquetipo"
            options={ARCHETYPE_SELECT}
            value={archetype}
            onValueChange={(v) => setArchetype(v as CharacterArchetype)}
            placeholder="Arquetipo"
            modalTitle="Arquetipo"
          />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xs },
});
