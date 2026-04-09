import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { CatalogImageField } from '@/components/signals/CatalogImageField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyboardAvoidingScroll } from '@/components/ui/KeyboardAvoidingScroll';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { fetchSignalsCatalogEntity } from '@/lib/signalsCatalogEntity';
import { queryKeys } from '@/lib/queryKeys';
import { apiErrorMessage } from '@/services/api';
import {
  charactersService,
  CHARACTER_ARCHETYPE_OPTIONS,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  feelingsService,
  FEELING_KIND_OPTIONS,
  locationsService,
  LOCATION_SETTING_OPTIONS,
  type CharacterArchetype,
  type FeelingKind,
  type LocationSetting,
} from '@/services';
import {
  SIGNAL_ENTITY_SECTIONS,
  type SignalEntityListSlug,
} from '@/services/signalEntities';
import { colors, spacing, typography } from '@/theme';

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

const ARCH_OPTIONS: SelectOption[] = CHARACTER_ARCHETYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const SETTING_OPTIONS: SelectOption[] = LOCATION_SETTING_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const KIND_OPTIONS: SelectOption[] = FEELING_KIND_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

type CharacterFields = {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri: string;
};

type LocationFields = {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri: string;
};

type ObjectFields = {
  name: string;
  description: string;
  imageUri: string;
};

type EventFields = {
  label: string;
  description: string;
};

type ContextFields = {
  title: string;
  description: string;
};

type FeelingFields = {
  kind: FeelingKind;
  intensity: number;
  notes: string;
};

/** /signals/:entity/:id/edit — PATCH catalog fields per backend DTOs. */
export default function SignalsCatalogEditScreen() {
  const { entity, id } = useLocalSearchParams<{ entity: string; id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const slug = (entity ?? '').toLowerCase();
  const rawId = (id ?? '').trim();
  const known = isSignalSlug(slug)
    ? SIGNAL_ENTITY_SECTIONS.find((s) => s.listSlug === slug)
    : undefined;
  const screenTitle = known ? `Edit ${known.title}` : 'Edit';

  const slugOk = isSignalSlug(slug) && !!rawId;

  const [character, setCharacter] = useState<CharacterFields | null>(null);
  const [location, setLocation] = useState<LocationFields | null>(null);
  const [object, setObject] = useState<ObjectFields | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [context, setContext] = useState<ContextFields | null>(null);
  const [feeling, setFeeling] = useState<FeelingFields | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: queryKeys.signals.catalogDetail(
      slug as SignalEntityListSlug,
      rawId,
    ),
    queryFn: () =>
      fetchSignalsCatalogEntity(slug as SignalEntityListSlug, rawId),
    enabled: slugOk,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useLayoutEffect(() => {
    if (!detailQuery.data) {
      setCharacter(null);
      setLocation(null);
      setObject(null);
      setEvent(null);
      setContext(null);
      setFeeling(null);
      return;
    }
    const d = detailQuery.data;
    switch (d.slug) {
      case 'characters':
        setCharacter({
          name: d.data.name,
          description: d.data.description,
          isKnown: d.data.isKnown,
          archetype: d.data.archetype,
          imageUri: d.data.imageUri ?? '',
        });
        break;
      case 'locations':
        setLocation({
          name: d.data.name,
          description: d.data.description,
          isFamiliar: d.data.isFamiliar,
          setting: d.data.setting,
          imageUri: d.data.imageUri ?? '',
        });
        break;
      case 'objects':
        setObject({
          name: d.data.name,
          description: d.data.description ?? '',
          imageUri: d.data.imageUri ?? '',
        });
        break;
      case 'events':
        setEvent({
          label: d.data.label,
          description: d.data.description ?? '',
        });
        break;
      case 'life-context':
        setContext({
          title: d.data.title,
          description: d.data.description ?? '',
        });
        break;
      case 'feelings':
        setFeeling({
          kind: d.data.kind,
          intensity: d.data.intensity ?? 0,
          notes: d.data.notes ?? '',
        });
        break;
      default:
        break;
    }
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isSignalSlug(slug) || !rawId) {
        throw new Error('Invalid link');
      }

      switch (slug) {
        case 'characters': {
          if (!character) throw new Error('Missing form');
          const name = character.name.trim();
          await charactersService.update(rawId, {
            name,
            description: character.description.trim(),
            isKnown: character.isKnown,
            archetype: character.archetype,
            imageUri: character.imageUri.trim() || undefined,
          });
          break;
        }
        case 'locations': {
          if (!location) throw new Error('Missing form');
          const name = location.name.trim();
          await locationsService.update(rawId, {
            name,
            description: location.description.trim(),
            isFamiliar: location.isFamiliar,
            setting: location.setting,
            imageUri: location.imageUri.trim() || undefined,
          });
          break;
        }
        case 'objects': {
          if (!object) throw new Error('Missing form');
          const name = object.name.trim();
          await dreamObjectsService.update(rawId, {
            name,
            description: object.description.trim() || undefined,
            imageUri: object.imageUri.trim() || undefined,
          });
          break;
        }
        case 'events': {
          if (!event) throw new Error('Missing form');
          const label = event.label.trim();
          await dreamEventsService.update(rawId, {
            label,
            description: event.description.trim() || undefined,
          });
          break;
        }
        case 'life-context': {
          if (!context) throw new Error('Missing form');
          const title = context.title.trim();
          await contextLivesService.update(rawId, {
            title,
            description: context.description.trim() || undefined,
          });
          break;
        }
        case 'feelings': {
          if (!feeling) throw new Error('Missing form');
          await feelingsService.update(rawId, {
            kind: feeling.kind,
            intensity: feeling.intensity,
            notes: feeling.notes.trim() || undefined,
          });
          break;
        }
        default:
          break;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.hub() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.signals.catalogList(slug as SignalEntityListSlug),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.signals.catalogDetail(
          slug as SignalEntityListSlug,
          rawId,
        ),
      });
      router.back();
    },
    onError: (e: unknown) => {
      setFormError(apiErrorMessage(e));
    },
  });

  const onSave = useCallback(() => {
    setFormError(null);
    if (!isSignalSlug(slug) || !rawId) return;

    if (slug === 'characters') {
      if (!character) return;
      if (!character.name.trim()) {
        setFormError('Name is required');
        return;
      }
    }
    if (slug === 'locations') {
      if (!location) return;
      if (!location.name.trim()) {
        setFormError('Name is required');
        return;
      }
    }
    if (slug === 'objects') {
      if (!object) return;
      if (!object.name.trim()) {
        setFormError('Name is required');
        return;
      }
    }
    if (slug === 'events') {
      if (!event) return;
      if (!event.label.trim()) {
        setFormError('Label is required');
        return;
      }
    }
    if (slug === 'life-context') {
      if (!context) return;
      if (!context.title.trim()) {
        setFormError('Title is required');
        return;
      }
    }
    if (slug === 'feelings' && !feeling) return;

    saveMutation.mutate();
  }, [
    slug,
    rawId,
    character,
    location,
    object,
    event,
    context,
    feeling,
    saveMutation,
  ]);

  const ready =
    detailQuery.isSuccess &&
    (slug === 'characters'
      ? character !== null
      : slug === 'locations'
        ? location !== null
        : slug === 'objects'
          ? object !== null
          : slug === 'events'
            ? event !== null
            : slug === 'life-context'
              ? context !== null
              : slug === 'feelings'
                ? feeling !== null
                : false);

  const loadErr = !slugOk
    ? 'Invalid link'
    : detailQuery.error
      ? apiErrorMessage(detailQuery.error)
      : null;

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl }}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {screenTitle}
          </Text>
          <View style={styles.spacer} />
        </View>

        {detailQuery.isPending && slugOk ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : loadErr ? (
          <Text style={styles.errBanner}>{loadErr}</Text>
        ) : (
          <KeyboardAvoidingScroll
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {slug === 'characters' && character ? (
              <>
                <Input
                  label="Name"
                  value={character.name}
                  onChangeText={(name) =>
                    setCharacter((p) => (p ? { ...p, name } : p))
                  }
                  maxLength={500}
                />
                <Textarea
                  label="Description"
                  value={character.description}
                  onChangeText={(description) =>
                    setCharacter((p) => (p ? { ...p, description } : p))
                  }
                  maxLength={16000}
                  minHeight={120}
                />
                <Switch
                  label="Known"
                  value={character.isKnown}
                  onValueChange={(isKnown) =>
                    setCharacter((p) => (p ? { ...p, isKnown } : p))
                  }
                />
                <Select
                  label="Archetype"
                  options={ARCH_OPTIONS}
                  value={character.archetype}
                  onValueChange={(v) =>
                    setCharacter((p) =>
                      p ? { ...p, archetype: v as CharacterArchetype } : p,
                    )
                  }
                  modalTitle="Archetype"
                />
                <CatalogImageField
                  uploadContext="characters"
                  value={character.imageUri}
                  onChange={(imageUri) =>
                    setCharacter((p) => (p ? { ...p, imageUri } : p))
                  }
                />
              </>
            ) : null}

            {slug === 'locations' && location ? (
              <>
                <Input
                  label="Name"
                  value={location.name}
                  onChangeText={(name) =>
                    setLocation((p) => (p ? { ...p, name } : p))
                  }
                  maxLength={500}
                />
                <Textarea
                  label="Description"
                  value={location.description}
                  onChangeText={(description) =>
                    setLocation((p) => (p ? { ...p, description } : p))
                  }
                  maxLength={16000}
                  minHeight={120}
                />
                <Switch
                  label="Familiar"
                  value={location.isFamiliar}
                  onValueChange={(isFamiliar) =>
                    setLocation((p) => (p ? { ...p, isFamiliar } : p))
                  }
                />
                <Select
                  label="Setting"
                  options={SETTING_OPTIONS}
                  value={location.setting}
                  onValueChange={(v) =>
                    setLocation((p) =>
                      p ? { ...p, setting: v as LocationSetting } : p,
                    )
                  }
                  modalTitle="Setting"
                />
                <CatalogImageField
                  uploadContext="locations"
                  value={location.imageUri}
                  onChange={(imageUri) =>
                    setLocation((p) => (p ? { ...p, imageUri } : p))
                  }
                />
              </>
            ) : null}

            {slug === 'objects' && object ? (
              <>
                <Input
                  label="Name"
                  value={object.name}
                  onChangeText={(name) =>
                    setObject((p) => (p ? { ...p, name } : p))
                  }
                  maxLength={500}
                />
                <Textarea
                  label="Description"
                  value={object.description}
                  onChangeText={(description) =>
                    setObject((p) => (p ? { ...p, description } : p))
                  }
                  maxLength={16000}
                  minHeight={120}
                />
                <CatalogImageField
                  uploadContext="objects"
                  value={object.imageUri}
                  onChange={(imageUri) =>
                    setObject((p) => (p ? { ...p, imageUri } : p))
                  }
                />
              </>
            ) : null}

            {slug === 'events' && event ? (
              <>
                <Input
                  label="Label"
                  value={event.label}
                  onChangeText={(label) =>
                    setEvent((p) => (p ? { ...p, label } : p))
                  }
                  maxLength={500}
                />
                <Textarea
                  label="Description"
                  value={event.description}
                  onChangeText={(description) =>
                    setEvent((p) => (p ? { ...p, description } : p))
                  }
                  maxLength={16000}
                  minHeight={120}
                />
                <Text style={styles.readOnlyHint}>
                  Dream session is fixed for this record; change it from the dream
                  flow if needed.
                </Text>
              </>
            ) : null}

            {slug === 'life-context' && context ? (
              <>
                <Input
                  label="Title"
                  value={context.title}
                  onChangeText={(title) =>
                    setContext((p) => (p ? { ...p, title } : p))
                  }
                  maxLength={500}
                />
                <Textarea
                  label="Description"
                  value={context.description}
                  onChangeText={(description) =>
                    setContext((p) => (p ? { ...p, description } : p))
                  }
                  maxLength={16000}
                  minHeight={120}
                />
              </>
            ) : null}

            {slug === 'feelings' && feeling ? (
              <>
                <Select
                  label="Kind"
                  options={KIND_OPTIONS}
                  value={feeling.kind}
                  onValueChange={(v) =>
                    setFeeling((p) =>
                      p ? { ...p, kind: v as FeelingKind } : p,
                    )
                  }
                  modalTitle="Feeling kind"
                />
                <Slider
                  label="Intensity (0–10)"
                  value={feeling.intensity}
                  onValueChange={(intensity) =>
                    setFeeling((p) => (p ? { ...p, intensity } : p))
                  }
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                />
                <Textarea
                  label="Notes"
                  value={feeling.notes}
                  onChangeText={(notes) =>
                    setFeeling((p) => (p ? { ...p, notes } : p))
                  }
                  maxLength={16000}
                  minHeight={100}
                />
                <Text style={styles.readOnlyHint}>
                  Linked dream session is not edited here.
                </Text>
              </>
            ) : null}

            {formError ? (
              <Text style={styles.formErr}>{formError}</Text>
            ) : null}

            <Button
              variant="yellow"
              onPress={onSave}
              loading={saveMutation.isPending}
              loadingLabel="Saving…"
              disabled={!ready || saveMutation.isPending}
            >
              Save
            </Button>
          </KeyboardAvoidingScroll>
        )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  screenTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  spacer: { width: 40 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  errBanner: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  formErr: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  readOnlyHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
