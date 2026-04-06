import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  LOCATION_SETTING_OPTIONS,
  type LocationSetting,
  locationsService,
} from '@/services';
import type { SelectOption } from '@/components/ui';
import { Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { LocRow } from '../types';

const SETTING_SELECT: SelectOption[] = LOCATION_SETTING_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function LocationCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: {
    name: string;
    description: string;
    isFamiliar: boolean;
    setting: LocationSetting;
  }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');
  const [isFamiliar, setIsFamiliar] = useState(false);
  const [setting, setSetting] = useState<LocationSetting | null>('INDOOR');

  return (
    <Modal
      visible={true}
      title="Nuevo lugar"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        const d = description.trim();
        if (!n || !d || !setting) return;
        onSubmit({ name: n, description: d, isFamiliar, setting });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea label="Descripción" value={description} onChangeText={setDescription} />
      <Switch label="¿Te resulta familiar?" value={isFamiliar} onValueChange={setIsFamiliar} />
      <Select
        label="Ambiente"
        options={SETTING_SELECT}
        value={setting}
        onValueChange={(v) => setSetting(v as LocationSetting)}
        placeholder="Ambiente"
        modalTitle="Ambiente"
      />
    </Modal>
  );
}

export function LocationEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: LocRow;
  onClose: () => void;
  onApplied: (next: LocRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFamiliar, setIsFamiliar] = useState(false);
  const [setting, setSetting] = useState<LocationSetting | null>(null);

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description);
      setIsFamiliar(row.isFamiliar);
      setSetting(row.setting);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void locationsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setName(x.name);
        setDescription(x.description);
        setIsFamiliar(x.isFamiliar);
        setSetting(x.setting);
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
    if (!n || !d || !setting) return;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await locationsService.update(row.id, { name: n, description: d, isFamiliar, setting });
        invalidateSignalsAfterCatalogWrite(queryClient, 'locations', row.id);
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', name: n, description: d, isFamiliar, setting });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar lugar' : 'Editar borrador (lugar)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving || !setting}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Nombre" value={name} onChangeText={setName} />
          <Textarea label="Descripción" value={description} onChangeText={setDescription} />
          <Switch label="¿Te resulta familiar?" value={isFamiliar} onValueChange={setIsFamiliar} />
          <Select
            label="Ambiente"
            options={SETTING_SELECT}
            value={setting}
            onValueChange={(v) => setSetting(v as LocationSetting)}
            placeholder="Ambiente"
            modalTitle="Ambiente"
          />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xs },
});
