import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, typography } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextareaFullHeight } from '@/components/ui/TextareaFullHeight';
import {
  ApiError,
  apiErrorMessage,
  dreamSessionsService,
} from '@/services';

const TABS = ['draft', 'elements', 'detail', 'thought'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABEL: Record<TabId, string> = {
  draft: '1. Borrador',
  elements: '2. Elementos',
  detail: '3. Detalle',
  thought: '4. Reflexión',
};

const TAB_ICON: Record<TabId, keyof typeof Ionicons.glyphMap> = {
  draft: 'document-text-outline',
  elements: 'pricetags-outline',
  detail: 'grid-outline',
  thought: 'bulb-outline',
};

export default function NewDreamScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('draft');
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftError, setDraftError] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{
    message: string;
    kind: 'network' | 'server';
  } | null>(null);

  function onDraftTextChange(text: string) {
    setDraftText(text);
    if (draftError) setDraftError(undefined);
  }

  function selectTab(tab: TabId) {
    if (tab !== 'draft' && !draftSaved) return;
    setActiveTab(tab);
  }

  async function handleSaveDraft() {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setDraftError('Escribe la narrativa del sueño antes de guardar.');
      return;
    }
    setDraftError(undefined);
    setSaving(true);
    try {
      const now = new Date();
      if (sessionId) {
        await dreamSessionsService.update(sessionId, {
          rawNarrative: trimmed,
          timestamp: now,
          status: 'DRAFT',
        });
      } else {
        const created = await dreamSessionsService.create({
          timestamp: now,
          status: 'DRAFT',
          rawNarrative: trimmed,
        });
        setSessionId(created.id);
      }
      setDraftSaved(true);
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      setSaveError({ message: msg, kind });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={s.root}
    >
      <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={s.headerText}>
            <Text style={s.title}>Nuevo sueño</Text>
            <Text style={s.subtitle}>Paso a paso</Text>
          </View>
        </View>

        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            const locked = tab !== 'draft' && !draftSaved;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: active, disabled: locked }}
                onPress={() => selectTab(tab)}
                disabled={locked}
                style={[
                  s.tabItem,
                  active && s.tabItemActive,
                  locked && s.tabItemLocked,
                ]}
              >
                <Ionicons
                  name={TAB_ICON[tab]}
                  size={14}
                  color={
                    locked
                      ? colors.textMuted
                      : active
                        ? colors.textInverse
                        : colors.textMuted
                  }
                />
                <Text
                  style={[s.tabLabel, active && s.tabLabelActive, locked && s.tabLabelLocked]}
                  numberOfLines={1}
                >
                  {TAB_LABEL[tab]}
                </Text>
                {locked && (
                  <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={s.content}>
          {activeTab === 'draft' && (
            <View style={s.draftColumn}>
              <TextareaFullHeight
                label="Narrativa"
                placeholder="Anoche soñé que…"
                value={draftText}
                onChangeText={onDraftTextChange}
                error={draftError}
              />
              <View style={s.draftFooter}>
                <Button
                  variant="purple"
                  onPress={() => void handleSaveDraft()}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar borrador'}
                </Button>
                {!draftSaved && (
                  <Text style={s.hint}>
                    Guarda el borrador para desbloquear los siguientes pasos.
                  </Text>
                )}
              </View>
            </View>
          )}

          {activeTab === 'elements' && (
            <View style={s.placeholderWrap}>
              <Text style={s.placeholder}>Elementos — próximo paso</Text>
            </View>
          )}

          {activeTab === 'detail' && (
            <View style={s.placeholderWrap}>
              <Text style={s.placeholder}>Detalle — próximo paso</Text>
            </View>
          )}

          {activeTab === 'thought' && (
            <View style={s.placeholderWrap}>
              <Text style={s.placeholder}>Reflexión — próximo paso</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>

    <Modal
      visible={saveError !== null}
      onClose={() => setSaveError(null)}
      title="No se pudo guardar"
      closeLabel="Entendido"
    >
      {saveError ? (
        <View style={s.errorModalBody}>
          <View
            style={[
              s.errorIconWrap,
              saveError.kind === 'network' && s.errorIconWrapNetwork,
            ]}
          >
            <Ionicons
              name={
                saveError.kind === 'network'
                  ? 'cloud-offline-outline'
                  : 'alert-circle-outline'
              }
              size={44}
              color={
                saveError.kind === 'network' ? colors.info : colors.danger
              }
            />
          </View>
          <Text style={s.errorModalMessage}>{saveError.message}</Text>
        </View>
      ) : null}
    </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: { marginLeft: -spacing.xs, padding: spacing.xs },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
  },
  tabItemLocked: {
    opacity: 0.55,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  tabLabelLocked: {
    color: colors.textMuted,
  },

  content: { flex: 1, minHeight: 0 },
  draftColumn: {
    flex: 1,
    minHeight: 0,
    gap: spacing.md,
  },
  draftFooter: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  hint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  placeholderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  placeholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },

  errorModalBody: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 93, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 106, 0.25)',
  },
  errorIconWrapNetwork: {
    backgroundColor: 'rgba(109, 179, 255, 0.12)',
    borderColor: 'rgba(109, 179, 255, 0.28)',
  },
  errorModalMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
