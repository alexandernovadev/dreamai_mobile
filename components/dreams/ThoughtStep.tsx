import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingScroll } from '@/components/ui/KeyboardAvoidingScroll';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { TextareaFullHeight } from '@/components/ui/TextareaFullHeight';
import { useSuccessBanner } from '@/hooks/useSuccessBanner';
import {
  ApiError,
  apiErrorMessage,
  dreamSessionsService,
  type DreamSession,
} from '@/services';
import { DREAM_LIST_QUERY_PARAMS } from '@/lib/dreamListQuery';
import { queryKeys } from '@/lib/queryKeys';
import { colors, radius, spacing, typography } from '@/theme';

type ThoughtPanel = 'ai' | 'thought';

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
  const queryClient = useQueryClient();
  const [text, setText] = useState(initialUserThought ?? '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(
    initialAiSummarize?.trim() ? initialAiSummarize.trim() : null,
  );
  const [panel, setPanel] = useState<ThoughtPanel>('ai');
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

  useEffect(() => {
    setPanel('ai');
  }, [sessionId]);

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
      queryClient.setQueryData(
        queryKeys.dreamSessions.detail(sessionId),
        session,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dreamSessions.hydrated(sessionId),
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
  }, [queryClient, sessionId, text, onError, onSaved, showSuccessBanner]);

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
      queryClient.setQueryData(
        queryKeys.dreamSessions.detail(sessionId),
        session,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dreamSessions.hydrated(sessionId),
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
  }, [queryClient, sessionId, onError, onSaved, showSuccessBanner]);

  return (
    <KeyboardAvoidingScroll
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        panel === 'thought' && styles.scrollContentThought,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Interpretación onírica con IA o tu propia reflexión al despertar.
      </Text>

      <View style={styles.tabBar}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: panel === 'ai' }}
          onPress={() => setPanel('ai')}
          style={({ pressed }) => [
            styles.tabItem,
            panel === 'ai' && styles.tabItemActive,
            pressed && panel !== 'ai' && { opacity: 0.85 },
          ]}
        >
          <Text
            style={[styles.tabLabel, panel === 'ai' && styles.tabLabelActive]}
            numberOfLines={1}
          >
            AI
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: panel === 'thought' }}
          onPress={() => setPanel('thought')}
          style={({ pressed }) => [
            styles.tabItem,
            panel === 'thought' && styles.tabItemActive,
            pressed && panel !== 'thought' && { opacity: 0.85 },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              panel === 'thought' && styles.tabLabelActive,
            ]}
            numberOfLines={1}
          >
            Your thought
          </Text>
        </Pressable>
      </View>

      {panel === 'ai' ? (
        <View style={styles.aiBlock}>
          <View style={styles.aiHeaderRow}>
            <Text style={styles.aiHeaderTitle}>Asistencia AI</Text>
            <Button
              variant="purple"
              compact
              loading={aiLoading}
              loadingLabel="Generando…"
              iconStart={
                <Ionicons name="sparkles" size={18} color={colors.text} />
              }
              onPress={() => void handleSuggestThought()}
              accessibilityHint="Genera la lectura onírica con IA y la guarda automáticamente"
            >
              DreamAI Leelo !
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
      ) : (
        <View style={styles.thoughtColumn}>
          <TextareaFullHeight
            label="Tu reflexión"
            placeholder="Escribir libremente…"
            value={text}
            onChangeText={setText}
            autoCapitalize="sentences"
            hint={
              !canSave
                ? 'Escribe una reflexión para poder guardar (no vale solo espacios en blanco).'
                : undefined
            }
          />
        </View>
      )}

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
  /** Permite que el bloque de reflexión ocupe el alto disponible (como el borrador). */
  scrollContentThought: {
    flexGrow: 1,
  },
  thoughtColumn: {
    flex: 1,
    minHeight: 280,
    minWidth: 0,
  },
  intro: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
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
    marginTop: spacing.sm,
  },
});
