import { useCallback } from 'react';
import { ApiError, apiErrorMessage, type CharacterArchetype, type FeelingKind, type LocationSetting } from '@/services';
import { CharacterCreateModal, CharacterEditModal } from './modals/CharacterModals';
import { ContextCreateModal, ContextEditModal } from './modals/ContextModals';
import { EventCreateModal, EventEditModal } from './modals/EventModals';
import { FeelingCreateModal, FeelingEditModal } from './modals/FeelingModals';
import { LocationCreateModal, LocationEditModal } from './modals/LocationModals';
import { ObjectCreateModal, ObjectEditModal } from './modals/ObjectModals';
import type { CharRow, CtxRow, EventRow, FeelingRow, LocRow, ObjRow, StepModal } from './types';

type Props = {
  modal: StepModal;
  sessionId: string;
  onClose: () => void;
  onError: (message: string, kind: 'network' | 'server') => void;
  onAddCharacter: (row: { name: string; description: string; isKnown: boolean; archetype: CharacterArchetype }) => void;
  onUpdateCharacter: (next: CharRow) => void;
  onAddLocation: (row: { name: string; description: string; isFamiliar: boolean; setting: LocationSetting }) => void;
  onUpdateLocation: (next: LocRow) => void;
  onAddObject: (row: { name: string; description?: string }) => void;
  onUpdateObject: (next: ObjRow) => void;
  onAddEvent: (row: { label: string; description?: string }) => void;
  onUpdateEvent: (next: EventRow) => void;
  onAddContext: (row: { title: string; description?: string }) => void;
  onUpdateContext: (next: CtxRow) => void;
  onAddFeeling: (row: { kind: FeelingKind; intensity?: number; notes?: string }) => void;
  onUpdateFeeling: (next: FeelingRow) => void;
};

export function StepModals({
  modal,
  sessionId,
  onClose,
  onError,
  onAddCharacter,
  onUpdateCharacter,
  onAddLocation,
  onUpdateLocation,
  onAddObject,
  onUpdateObject,
  onAddEvent,
  onUpdateEvent,
  onAddContext,
  onUpdateContext,
  onAddFeeling,
  onUpdateFeeling,
}: Props) {
  const reportErr = useCallback(
    (e: unknown) => {
      const msg = apiErrorMessage(e);
      const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    },
    [onError],
  );

  if (!modal) return null;

  if (modal.kind === 'character') {
    return modal.mode === 'create' ? (
      <CharacterCreateModal
        key={`char-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddCharacter}
      />
    ) : (
      <CharacterEditModal
        key={`echar-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateCharacter}
        onApiError={reportErr}
      />
    );
  }

  if (modal.kind === 'location') {
    return modal.mode === 'create' ? (
      <LocationCreateModal
        key={`loc-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddLocation}
      />
    ) : (
      <LocationEditModal
        key={`eloc-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateLocation}
        onApiError={reportErr}
      />
    );
  }

  if (modal.kind === 'object') {
    return modal.mode === 'create' ? (
      <ObjectCreateModal
        key={`obj-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddObject}
      />
    ) : (
      <ObjectEditModal
        key={`eobj-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateObject}
        onApiError={reportErr}
      />
    );
  }

  if (modal.kind === 'event') {
    return modal.mode === 'create' ? (
      <EventCreateModal
        key={`ev-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddEvent}
      />
    ) : (
      <EventEditModal
        key={`eev-${modal.row.key}`}
        row={modal.row}
        sessionId={sessionId}
        onClose={onClose}
        onApplied={onUpdateEvent}
        onApiError={reportErr}
      />
    );
  }

  if (modal.kind === 'context') {
    return modal.mode === 'create' ? (
      <ContextCreateModal
        key={`ctx-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddContext}
      />
    ) : (
      <ContextEditModal
        key={`ectx-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateContext}
        onApiError={reportErr}
      />
    );
  }

  if (modal.kind === 'feeling') {
    return modal.mode === 'create' ? (
      <FeelingCreateModal key="feeling-new" onClose={onClose} onSubmit={onAddFeeling} />
    ) : (
      <FeelingEditModal
        key={`efeel-${modal.row.key}`}
        row={modal.row}
        sessionId={sessionId}
        onClose={onClose}
        onApplied={onUpdateFeeling}
        onApiError={reportErr}
      />
    );
  }

  return null;
}
