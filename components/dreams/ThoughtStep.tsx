import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingScroll } from '@/components/ui/KeyboardAvoidingScroll';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { Textarea } from '@/components/ui/Textarea';
import { useSuccessBanner } from '@/hooks/useSuccessBanner';
import {
  ApiError,
  apiErrorMessage,
  dreamSessionsService,
  type DreamSession,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

export type ThoughtStepProps = {
  sessionId: string;
  initialUserThought?: string;
  /** Última lectura IA guardada en la sesión (opcional). */
  initialAiSummarize?: string;
  onSaved?: (session: DreamSession) => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

/**
 * Paso final: reflexión escrita + lectura sugerida por IA (opcional, persistida en `aiSummarize`).
 */
export function ThoughtStep({
  sessionId,
  initialUserThought,
  initialAiSummarize,
  onSaved,
  onError,
}: ThoughtStepProps) {
  const [text, setText] = useState(initialUserThought ?? '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(
    initialAiSummarize?.trim() ? initialAiSummarize.trim() : null,
  );
  const [savingAiNote, setSavingAiNote] = useState(false);
  const { message: successMsg, show: showSuccessBanner } = useSuccessBanner();

  const trimmed = text.trim();
  const canSave = trimmed.length > 0;

  useEffect(() => {
    setText(initialUserThought ?? '');
  }, [sessionId, initialUserThought]);

  useEffect(() => {
    const s = initialAiSummarize?.trim();
    setSuggestion(s ? s : null);
  }, [sessionId, initialAiSummarize]);

  const handleSave = useCallback(async () => {
    if (!text.trim()) {
      return;
    }
    setSaving(true);
    try {
      const session = await dreamSessionsService.update(sessionId, {
        userThought: text.trim(),
        status: 'THOUGHT',
      });
      onSaved?.(session);
      showSuccessBanner('Reflexión guardada');
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setSaving(false);
    }
  }, [sessionId, text, onError, onSaved, showSuccessBanner]);

  const handleSuggestThought = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await dreamSessionsService.suggestThought(sessionId);
      const t = res.suggestion?.trim() ?? '';
      setSuggestion(t.length > 0 ? t : null);
      if (!t) {
        onError('La IA no devolvió texto. Inténtalo de nuevo.', 'server');
      }
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setAiLoading(false);
    }
  }, [sessionId, onError]);

  const handleAppendSuggestion = useCallback(() => {
    if (!suggestion?.trim()) return;
    const add = suggestion.trim();
    setText((prev) => {
      const p = prev.trim();
      if (!p) return add;
      return `${p}\n\n—\n\n${add}`;
    });
    showSuccessBanner('Texto añadido a tu reflexión');
  }, [suggestion, showSuccessBanner]);

  const handleSaveAiNote = useCallback(async () => {
    if (!suggestion?.trim()) return;
    setSavingAiNote(true);
    try {
      const session = await dreamSessionsService.update(sessionId, {
        aiSummarize: suggestion.trim(),
      });
      onSaved?.(session);
      showSuccessBanner('Nota IA guardada');
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setSavingAiNote(false);
    }
  }, [sessionId, suggestion, onError, onSaved, showSuccessBanner]);

  return (
    <KeyboardAvoidingScroll
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        ¿Qué te transmite este sueño al despertar? Anota sensaciones, símbolos que
        te resuenen o preguntas que quieras explorar.
      </Text>

      <Textarea
        label="Tu reflexión"
        placeholder="Escribir libremente…"
        value={text}
        onChangeText={setText}
        minHeight={180}
        maxHeight={320}
        autoCapitalize="sentences"
        hint={
          !canSave
            ? 'Escribe una reflexión para poder guardar (no vale solo espacios en blanco).'
            : undefined
        }
      />

      <View style={styles.aiBlock}>
        <Text style={styles.aiLabel}>Asistencia</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Genera una lectura sugerida con inteligencia artificial"
          onPress={() => {
            if (!aiLoading) void handleSuggestThought();
          }}
          disabled={aiLoading}
          style={({ pressed }) => [
            styles.aiBtnOuter,
            pressed && !aiLoading && { opacity: 0.92 },
            aiLoading && { opacity: 0.75 },
          ]}
        >
          <LinearGradient
            colors={['rgba(240, 200, 96, 0.45)', 'rgba(200, 140, 60, 0.25)', 'rgba(124, 92, 196, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiGradient}
          >
            {aiLoading ? (
              <ActivityIndicator color="#fff6d0" style={styles.aiSpinner} />
            ) : (
              <View style={styles.aiIconRing}>
                <Ionicons name="sparkles" size={26} color="#fff6d0" />
              </View>
            )}
            <View style={styles.aiTexts}>
              <Text style={styles.aiTitle}>Sugerencia con IA</Text>
              <Text style={styles.aiSubtitle}>
                Una lectura sugerida a partir de tu sueño y tu nota
              </Text>
            </View>
            {!aiLoading ? (
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.45)" />
            ) : null}
          </LinearGradient>
        </Pressable>

        {suggestion ? (
          <View style={styles.suggestionWrap}>
            <Text style={styles.suggestionLabel}>Lectura sugerida</Text>
            <ScrollView
              style={styles.suggestionScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </ScrollView>
            <View style={styles.suggestionActions}>
              <Button
                variant="outline"
                onPress={() => void handleAppendSuggestion()}
              >
                Añadir a mi reflexión
              </Button>
              <Button
                variant="purple"
                onPress={() => void handleSaveAiNote()}
                disabled={savingAiNote}
              >
                {savingAiNote ? 'Guardando…' : 'Guardar como nota IA'}
              </Button>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.saveBlock}>
        {successMsg ? <SuccessBanner message={successMsg} /> : null}
        <Button
          variant="purple"
          onPress={() => void handleSave()}
          disabled={saving || !canSave}
        >
          {saving ? 'Guardando…' : 'Guardar reflexión'}
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
  intro: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  aiBlock: {
    gap: spacing.sm,
  },
  aiLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  aiBtnOuter: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240, 200, 96, 0.35)',
  },
  aiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  aiSpinner: {
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  aiIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTexts: {
    flex: 1,
    gap: 4,
  },
  aiTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  aiSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  suggestionWrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  suggestionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  suggestionScroll: {
    maxHeight: 220,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  suggestionActions: {
    gap: spacing.sm,
  },
  saveBlock: {
    gap: spacing.md,
  },
});
