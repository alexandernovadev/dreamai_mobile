import { createElement, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { ChipVariant } from '@/components/ui/Chip';
import { KeyboardAvoidingScroll } from '@/components/ui/KeyboardAvoidingScroll';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useSuccessBanner } from '@/hooks/useSuccessBanner';
import {
  ApiError,
  apiErrorMessage,
  DREAM_KIND_OPTIONS,
  dreamSessionsService,
  uploadDreamImageToCloudinary,
  type DreamSession,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

const KIND_VARIANTS: ChipVariant[] = [
  'purple',
  'blue',
  'teal',
  'green',
  'orange',
  'rose',
];

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Valor para `<input type="datetime-local">` (zona local del dispositivo). */
function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type DreamDetailFormProps = {
  sessionId: string;
  initialTimestamp?: Date;
  initialDreamKind: string[];
  initialDreamImages: string[];
  onSaved?: (session: DreamSession) => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

export function DreamDetailForm({
  sessionId,
  initialTimestamp,
  initialDreamKind,
  initialDreamImages,
  onSaved,
  onError,
}: DreamDetailFormProps) {
  const { width } = useWindowDimensions();
  const thumbW = (Math.min(width - spacing.xl * 2, 400) - spacing.sm) / 2;

  const [ts, setTs] = useState(() => initialTimestamp ?? new Date());
  const [kinds, setKinds] = useState<string[]>(() => [...initialDreamKind]);
  const [images, setImages] = useState<string[]>(() => [...initialDreamImages]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { message: successMsg, show: showSuccessBanner } = useSuccessBanner();

  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<'idle' | 'date' | 'time'>(
    'idle',
  );

  useEffect(() => {
    setTs(initialTimestamp ?? new Date());
    setKinds([...initialDreamKind]);
    setImages([...initialDreamImages]);
  }, [sessionId, initialTimestamp, initialDreamKind, initialDreamImages]);

  const toggleKind = useCallback((value: string) => {
    setKinds((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  }, []);

  const onAndroidDate = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS !== 'android') return;
      if (event.type === 'dismissed') {
        setAndroidStep('idle');
        return;
      }
      if (!date) {
        setAndroidStep('idle');
        return;
      }
      setTs((prev) => {
        const n = new Date(prev);
        n.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        return n;
      });
      setAndroidStep('time');
    },
    [],
  );

  const onAndroidTime = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'android') return;
    setAndroidStep('idle');
    if (event.type === 'dismissed' || !date) return;
    setTs((prev) => {
      const n = new Date(prev);
      n.setHours(date.getHours(), date.getMinutes(), 0, 0);
      return n;
    });
  }, []);

  const openPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      setIosPickerOpen(true);
    } else if (Platform.OS !== 'web') {
      setAndroidStep('date');
    }
  }, []);

  const pickImages = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      onError(
        'Necesitamos acceso a la galería para subir imágenes.',
        'server',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      for (const asset of result.assets) {
        const url = await uploadDreamImageToCloudinary(asset);
        setImages((p) => [...p, url]);
      }
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setUploading(false);
    }
  }, [onError]);

  const removeImage = useCallback((uri: string) => {
    setImages((p) => p.filter((x) => x !== uri));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const session = await dreamSessionsService.update(sessionId, {
        timestamp: ts,
        dreamKind: kinds,
        dreamImages: images,
        status: 'STRUCTURED',
      });
      onSaved?.(session);
      showSuccessBanner('Detalle guardado');
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setSaving(false);
    }
  }, [sessionId, ts, kinds, images, onError, onSaved, showSuccessBanner]);

  return (
    <KeyboardAvoidingScroll
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>Fecha y hora del sueño</Text>
        </View>
        <Text style={styles.dateDisplay}>{formatDateTime(ts)}</Text>

        {Platform.OS === 'web' ? (
          <View style={styles.webDateWrap}>
            <Text style={styles.webDateLabel}>Fecha y hora</Text>
            {createElement('input', {
              type: 'datetime-local',
              value: toDatetimeLocalValue(ts),
              onChange: (e: { target: { value: string } }) => {
                const v = e.target.value;
                if (v) setTs(new Date(v));
              },
              style: styles.webDatetimeInput,
            })}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={openPicker}
            style={({ pressed }) => [
              styles.dateBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={['rgba(124, 92, 196, 0.35)', 'rgba(80, 168, 255, 0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dateBtnInner}
            >
              <Ionicons name="time-outline" size={18} color={colors.text} />
              <Text style={styles.dateBtnText}>Cambiar fecha y hora</Text>
            </LinearGradient>
          </Pressable>
        )}

        {Platform.OS === 'ios' && iosPickerOpen ? (
          <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setIosPickerOpen(false)}
          >
            <Pressable
              style={styles.iosModalBackdrop}
              onPress={() => setIosPickerOpen(false)}
            >
              <Pressable style={styles.iosModalCard} onPress={(e) => e.stopPropagation()}>
                <DateTimePicker
                  value={ts}
                  mode="datetime"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setTs(d);
                  }}
                  themeVariant="dark"
                />
                <Button variant="purple" onPress={() => setIosPickerOpen(false)}>
                  Listo
                </Button>
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}

        {Platform.OS === 'android' && androidStep === 'date' ? (
          <DateTimePicker
            value={ts}
            mode="date"
            display="default"
            onChange={onAndroidDate}
          />
        ) : null}
        {Platform.OS === 'android' && androidStep === 'time' ? (
          <DateTimePicker
            value={ts}
            mode="time"
            display="default"
            onChange={onAndroidTime}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="pricetags-outline" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>Tipo de sueño</Text>
        </View>
        <Text style={styles.cardHint}>Puedes elegir varias a la vez.</Text>
        <View style={styles.chipGrid}>
          {DREAM_KIND_OPTIONS.map((opt, idx) => {
            const selected = kinds.includes(opt.value);
            const colorVariant = KIND_VARIANTS[idx % KIND_VARIANTS.length];
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                variant={selected ? colorVariant : 'neutral'}
                selected={selected}
                onPress={() => toggleKind(opt.value)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons name="images-outline" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>Imágenes</Text>
        </View>
        <Text style={styles.cardHint}>
          Se suben al servidor (Cloudinary) y se guardan las URLs en el sueño.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void pickImages()}
          disabled={uploading}
          style={({ pressed }) => [
            styles.addImgBtn,
            (pressed && !uploading) && { opacity: 0.88 },
            uploading && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          <Text style={styles.addImgText}>
            {uploading ? 'Subiendo…' : 'Elegir imágenes de la galería'}
          </Text>
        </Pressable>
        {uploading ? (
          <ActivityIndicator color={colors.accent} style={styles.uploadSpinner} />
        ) : null}

        {images.length > 0 ? (
          <View style={styles.imageGrid}>
            {images.map((uri) => (
              <View key={uri} style={[styles.thumbWrap, { width: thumbW }]}>
                <Image
                  source={{ uri }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={200}
                />
                <Pressable
                  accessibilityLabel="Quitar imagen"
                  onPress={() => removeImage(uri)}
                  style={styles.thumbRemove}
                >
                  <Ionicons name="close-circle" size={26} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyImg}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyImgText}>Ninguna imagen aún</Text>
          </View>
        )}
      </View>

      <View style={styles.saveBlock}>
        {successMsg ? <SuccessBanner message={successMsg} /> : null}
        <Button
          variant="purple"
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar detalle'}
        </Button>
      </View>
    </KeyboardAvoidingScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  saveBlock: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  cardHint: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  dateDisplay: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  dateBtn: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
  },
  dateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  iosModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  iosModalCard: {
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  /** Web: contenedor del control nativo HTML `datetime-local`. */
  webDateWrap: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  webDateLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  /** Solo web: `<input type="datetime-local">` (picker del navegador). */
  webDatetimeInput: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.35)',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addImgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(124, 92, 196, 0.4)',
    backgroundColor: 'rgba(124, 92, 196, 0.06)',
  },
  addImgText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  uploadSpinner: { marginVertical: spacing.xs },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  thumbWrap: {
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  emptyImg: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyImgText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
