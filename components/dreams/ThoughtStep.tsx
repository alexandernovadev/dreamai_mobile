import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { colors, spacing, typography } from '@/theme';

export type ThoughtStepProps = {
  sessionId: string;
  initialUserThought?: string;
  /** Última lectura IA guardada en la sesión (opcional). */
  initialAiSummarize?: string;
  onSaved?: (session: DreamSession) => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

/**
 * Paso final: reflexión escrita + IA que genera y guarda `aiSummarize` automáticamente.
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
      if (!t) {
        onError('La IA no devolvió texto. Inténtalo de nuevo.', 'server');
        return;
      }
      const session = await dreamSessionsService.update(sessionId, {
        aiSummarize: t,
      });
      onSaved?.(session);
      setSuggestion(t);
      showSuccessBanner('Lectura guardada');
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setAiLoading(false);
    }
  }, [sessionId, onError, onSaved, showSuccessBanner]);

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
        <View style={styles.aiHeaderRow}>
          <Text style={styles.aiHeaderTitle}>Asistencia AI</Text>
          <Button
            variant="purple"
            compact
            loading={aiLoading}
            onPress={() => void handleSuggestThought()}
            accessibilityHint="Genera la lectura onírica con IA y la guarda automáticamente"
          >
            Generar
          </Button>
        </View>
        <View style={styles.aiDivider} />
        <ScrollView
          style={styles.aiReadingScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {suggestion ? (
            <Text style={styles.aiReadingText}>{suggestion}</Text>
          ) : (
            <Text style={styles.aiReadingPlaceholder}>
              La lectura onírica aparecerá aquí.
            </Text>
          )}
        </ScrollView>
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
    gap: 0,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  aiHeaderTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  aiDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  aiReadingScroll: {
    maxHeight: 320,
  },
  aiReadingText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    lineHeight: 26,
  },
  aiReadingPlaceholder: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  saveBlock: {
    gap: spacing.md,
  },
});
