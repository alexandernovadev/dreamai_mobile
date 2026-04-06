import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FEELING_KIND_OPTIONS, type FeelingKind, feelingsService } from '@/services';
import type { SelectOption } from '@/components/ui';
import { Input, Modal, Select, Slider } from '@/components/ui';
import { invalidateSignalsAfterCatalogWrite } from '../invalidateSignals';
import type { FeelingRow } from '../types';

const FEELING_SELECT: SelectOption[] = FEELING_KIND_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function FeelingCreateModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (row: { kind: FeelingKind; intensity?: number; notes?: string }) => void;
}) {
  const [kind, setKind] = useState<FeelingKind | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo sentimiento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      primaryDisabled={!kind}
      onPrimaryPress={() => {
        if (!kind) return;
        onSubmit({ kind, intensity, notes: notes.trim() || undefined });
      }}
    >
      <Select
        label="Tipo"
        options={FEELING_SELECT}
        value={kind}
        onValueChange={(v) => setKind(v as FeelingKind)}
        placeholder="Elige una emoción"
        modalTitle="Emoción"
      />
      <Slider
        label="Intensidad (0–10)"
        value={intensity}
        onValueChange={setIntensity}
        minimumValue={0}
        maximumValue={10}
        step={1}
      />
      <Input label="Notas (opcional)" value={notes} onChangeText={setNotes} />
    </Modal>
  );
}

export function FeelingEditModal({
  row,
  sessionId,
  onClose,
  onApplied,
  onApiError,
}: {
  row: FeelingRow;
  sessionId: string;
  onClose: () => void;
  onApplied: (next: FeelingRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<FeelingKind | null>(row.kind);
  const [intensity, setIntensity] = useState(row.intensity ?? 5);
  const [notes, setNotes] = useState(row.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!kind) return;
    const payload = { kind, intensity, notes: notes.trim() || undefined };
    if (row.id) {
      setSaving(true);
      try {
        await feelingsService.update(row.id, {
          kind: payload.kind,
          dreamSessionId: sessionId,
          intensity: payload.intensity,
          notes: payload.notes,
        });
        invalidateSignalsAfterCatalogWrite(queryClient, 'feelings', row.id);
        onApplied({ ...row, ...payload });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ ...row, ...payload });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title="Editar sentimiento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={!kind || saving}
      onPrimaryPress={() => void save()}
    >
      <Select
        label="Tipo"
        options={FEELING_SELECT}
        value={kind}
        onValueChange={(v) => setKind(v as FeelingKind)}
        placeholder="Elige una emoción"
        modalTitle="Emoción"
      />
      <Slider
        label="Intensidad (0–10)"
        value={intensity}
        onValueChange={setIntensity}
        minimumValue={0}
        maximumValue={10}
        step={1}
      />
      <Input label="Notas (opcional)" value={notes} onChangeText={setNotes} />
    </Modal>
  );
}

