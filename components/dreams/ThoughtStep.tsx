import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  onSaved?: (session: DreamSession) => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

/**
 * Paso final: reflexión escrita + acción de IA (UI; la IA llegará después).
 */
export function ThoughtStep({
  sessionId,
  initialUserThought,
  onSaved,
  onError,
}: ThoughtStepProps) {
  const [text, setText] = useState(initialUserThought ?? '');
  const [saving, setSaving] = useState(false);
  const { message: successMsg, show: showSuccessBanner } = useSuccessBanner();

  const trimmed = text.trim();
  const canSave = trimmed.length > 0;

  useEffect(() => {
    setText(initialUserThought ?? '');
  }, [sessionId, initialUserThought]);

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
          accessibilityHint="La sugerencia con IA estará disponible en una próxima versión"
          onPress={() => {
            /* IA: próximamente */
          }}
          style={({ pressed }) => [
            styles.aiBtnOuter,
            pressed && { opacity: 0.92 },
          ]}
        >
          <LinearGradient
            colors={['rgba(240, 200, 96, 0.45)', 'rgba(200, 140, 60, 0.25)', 'rgba(124, 92, 196, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiGradient}
          >
            <View style={styles.aiIconRing}>
              <Ionicons name="sparkles" size={26} color="#fff6d0" />
            </View>
            <View style={styles.aiTexts}>
              <Text style={styles.aiTitle}>Sugerencia con IA</Text>
              <Text style={styles.aiSubtitle}>
                Una lectura sugerida a partir de tu sueño y tu nota
              </Text>
              <View style={styles.badgeSoon}>
                <Text style={styles.badgeSoonText}>Próximamente</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.45)" />
          </LinearGradient>
        </Pressable>
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
  badgeSoon: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeSoonText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: 'rgba(255, 230, 180, 0.95)',
    letterSpacing: 0.4,
  },
  saveBlock: {
    gap: spacing.md,
  },
});
