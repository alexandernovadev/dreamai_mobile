import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DREAM_LIST_QUERY_PARAMS } from "@/lib/dreamListQuery";
import { queryKeys } from "@/lib/queryKeys";
import { colors, gradients, radius, spacing, typography } from "@/theme";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SuccessBanner } from "@/components/ui/SuccessBanner";
import { TextareaFullHeight } from "@/components/ui/TextareaFullHeight";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { DreamDetailForm } from "@/components/dreams/DreamDetailForm";
import { ElementsStep } from "@/components/dreams/ElementsStep";
import { ThoughtStep } from "@/components/dreams/ThoughtStep";
import {
  ApiError,
  apiErrorMessage,
  dreamSessionsService,
  filterAllowedPerspectives,
  type DreamSession,
} from "@/services";

const TABS = ["draft", "elements", "detail", "thought"] as const;
type TabId = (typeof TABS)[number];

const TAB_LABEL: Record<TabId, string> = {
  draft: "1. Borrador",
  elements: "2. Elementos",
  detail: "3. Detalle",
  thought: "4. Reflexión",
};

const TAB_ICON: Record<TabId, keyof typeof Ionicons.glyphMap> = {
  draft: "document-text-outline",
  elements: "pricetags-outline",
  detail: "grid-outline",
  thought: "bulb-outline",
};

export type DreamEditorScreenProps = {
  mode: "new" | "edit";
  /** Obligatorio si `mode === 'edit'` */
  initialSessionId?: string;
};

export function DreamEditorScreen({
  mode,
  initialSessionId,
}: DreamEditorScreenProps) {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const editSessionId = initialSessionId?.trim() ?? "";
  const detailQuery = useQuery({
    queryKey: queryKeys.dreamSessions.detail(editSessionId),
    queryFn: () => dreamSessionsService.getOne(editSessionId),
    enabled: mode === "edit" && editSessionId.length > 0,
    refetchOnWindowFocus: false,
  });

  /** Evita pisar borrador local si el detalle se invalida/refetch mientras editas. */
  const hydratedFromQueryRef = useRef(false);

  useEffect(() => {
    hydratedFromQueryRef.current = false;
  }, [editSessionId]);

  useEffect(() => {
    if (mode !== "edit" || !detailQuery.data) return;
    if (hydratedFromQueryRef.current) return;
    hydratedFromQueryRef.current = true;
    const s = detailQuery.data;
    setSessionId(s.id);
    setDraftText(s.rawNarrative);
    setDetailTimestamp(s.timestamp);
    setDetailKinds(s.dreamKind ?? []);
    setDetailImages(s.dreamImages ?? []);
    setDetailPerspectives(
      filterAllowedPerspectives(s.analysis?.perspectives ?? []),
    );
    setDetailLucidityLevel(s.analysis?.lucidityLevel);
    setUserThought(s.userThought ?? "");
    setAiSummarize(s.aiSummarize);
    setDraftSaved(true);
  }, [mode, detailQuery.data]);

  const bootLoading =
    mode === "edit" && editSessionId.length > 0 && detailQuery.isPending;
  const bootError =
    mode === "edit" && editSessionId.length > 0 && detailQuery.isError
      ? apiErrorMessage(detailQuery.error)
      : null;

  const [activeTab, setActiveTab] = useState<TabId>("draft");
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftError, setDraftError] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{
    message: string;
    kind: "network" | "server";
  } | null>(null);

  const [detailTimestamp, setDetailTimestamp] = useState<Date | undefined>();
  const [detailKinds, setDetailKinds] = useState<string[]>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detailPerspectives, setDetailPerspectives] = useState<string[]>([]);
  const [detailLucidityLevel, setDetailLucidityLevel] = useState<
    number | undefined
  >();
  const [userThought, setUserThought] = useState<string>("");
  const [aiSummarize, setAiSummarize] = useState<string | undefined>();
  const { message: draftSuccessMsg, show: showDraftSuccess } =
    useSuccessBanner();

  type SaveDraftVars = { trimmed: string; existingId: string | null };

  const saveDraftMutation = useMutation<DreamSession, unknown, SaveDraftVars>({
    mutationFn: async ({ trimmed, existingId }) => {
      const now = new Date();
      if (existingId) {
        return dreamSessionsService.update(existingId, {
          rawNarrative: trimmed,
          timestamp: now,
          status: "DRAFT",
        });
      }
      return dreamSessionsService.create({
        timestamp: now,
        status: "DRAFT",
        rawNarrative: trimmed,
      });
    },
    onSuccess: (saved) => {
      setSessionId(saved.id);
      setDetailTimestamp(saved.timestamp);
      setDetailKinds(saved.dreamKind ?? []);
      setDetailImages(saved.dreamImages ?? []);
      setDetailPerspectives(
        filterAllowedPerspectives(saved.analysis?.perspectives ?? []),
      );
      setDetailLucidityLevel(saved.analysis?.lucidityLevel);
      setUserThought(saved.userThought ?? "");
      setAiSummarize(saved.aiSummarize);
      queryClient.setQueryData(queryKeys.dreamSessions.detail(saved.id), saved);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
      });
      setDraftSaved(true);
      showDraftSuccess("Borrador guardado");
    },
    onError: (e) => {
      const msg = apiErrorMessage(e);
      const kind =
        e instanceof ApiError && e.status === 0 ? "network" : "server";
      setSaveError({ message: msg, kind });
    },
  });

  function onDraftTextChange(text: string) {
    setDraftText(text);
    if (draftError) setDraftError(undefined);
  }

  function selectTab(tab: TabId) {
    if (tab !== "draft" && !draftSaved) return;
    setActiveTab(tab);
  }

  function handleSaveDraft() {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setDraftError("Escribe la narrativa del sueño antes de guardar.");
      return;
    }
    setDraftError(undefined);
    saveDraftMutation.mutate({ trimmed, existingId: sessionId });
  }

  const title = mode === "edit" ? "Editar sueño" : "Nuevo sueño";

  if (bootLoading) {
    return (
      <LinearGradient
        colors={[...bg.colors]}
        start={bg.start}
        end={bg.end}
        style={styles.root}
      >
        <View style={[styles.boot, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.bootText}>Cargando sueño…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (bootError) {
    return (
      <LinearGradient
        colors={[...bg.colors]}
        start={bg.start}
        end={bg.end}
        style={styles.root}
      >
        <View
          style={[
            styles.boot,
            { paddingTop: insets.top, paddingHorizontal: spacing.xl },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.danger}
          />
          <Text style={styles.bootErrText}>{bootError}</Text>
          <View style={styles.bootErrActions}>
            <Button
              variant="purple"
              disabled={detailQuery.isFetching}
              onPress={() => void detailQuery.refetch()}
            >
              Reintentar
            </Button>
            <Button variant="outline" onPress={() => router.back()}>
              Volver
            </Button>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[...bg.colors]}
        start={bg.start}
        end={bg.end}
        style={styles.root}
      >
        <View
          style={[
            styles.safe,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>

          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = activeTab === tab;
              const locked = tab !== "draft" && !draftSaved;
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active, disabled: locked }}
                  onPress={() => selectTab(tab)}
                  disabled={locked}
                  style={[
                    styles.tabItem,
                    active && styles.tabItemActive,
                    locked && styles.tabItemLocked,
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
                    style={[
                      styles.tabLabel,
                      active && styles.tabLabelActive,
                      locked && styles.tabLabelLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {TAB_LABEL[tab]}
                  </Text>
                  {locked && (
                    <Ionicons
                      name="lock-closed"
                      size={10}
                      color={colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.content}>
            {activeTab === "draft" && (
              <View style={styles.draftColumn}>
                <TextareaFullHeight
                  label="Narrativa"
                  placeholder="Anoche soñé que…"
                  value={draftText}
                  onChangeText={onDraftTextChange}
                  error={draftError}
                />
                <View style={styles.draftFooter}>
                  {draftSuccessMsg ? (
                    <SuccessBanner message={draftSuccessMsg} />
                  ) : null}
                  <Button
                    variant="purple"
                    onPress={() => void handleSaveDraft()}
                    disabled={saveDraftMutation.isPending}
                  >
                    {saveDraftMutation.isPending
                      ? "Guardando…"
                      : "Guardar borrador"}
                  </Button>
                  {!draftSaved && (
                    <Text style={styles.hint}>
                      Guarda el borrador para desbloquear los siguientes pasos.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {draftSaved && sessionId ? (
              <View
                style={[
                  styles.elementsPanel,
                  activeTab !== "elements" && styles.elementsPanelHidden,
                ]}
              >
                <ElementsStep
                  sessionId={sessionId}
                  onError={(message, kind) => setSaveError({ message, kind })}
                />
              </View>
            ) : null}

            {activeTab === "detail" && draftSaved && sessionId ? (
              <View style={styles.detailPanel}>
                <DreamDetailForm
                  sessionId={sessionId}
                  initialTimestamp={detailTimestamp}
                  initialDreamKind={detailKinds}
                  initialDreamImages={detailImages}
                  initialPerspectives={detailPerspectives}
                  initialLucidityLevel={detailLucidityLevel}
                  onSaved={(s) => {
                    setDetailTimestamp(s.timestamp);
                    setDetailKinds(s.dreamKind ?? []);
                    setDetailImages(s.dreamImages ?? []);
                    setDetailPerspectives(
                      filterAllowedPerspectives(s.analysis?.perspectives ?? []),
                    );
                    setDetailLucidityLevel(s.analysis?.lucidityLevel);
                  }}
                  onError={(message, kind) => setSaveError({ message, kind })}
                />
              </View>
            ) : activeTab === "detail" ? (
              <View style={styles.placeholderWrap}>
                <Text style={styles.placeholder}>
                  Guarda el borrador para editar fecha, tipos e imágenes.
                </Text>
              </View>
            ) : null}

            {draftSaved && sessionId ? (
              <View
                style={[
                  styles.thoughtPanel,
                  activeTab !== "thought" && styles.elementsPanelHidden,
                ]}
              >
                <ThoughtStep
                  sessionId={sessionId}
                  initialUserThought={userThought}
                  initialAiSummarize={aiSummarize}
                  onSaved={(s) => {
                    setUserThought(s.userThought ?? "");
                    setAiSummarize(s.aiSummarize);
                  }}
                  onError={(message, kind) => setSaveError({ message, kind })}
                />
              </View>
            ) : null}
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
          <View style={styles.errorModalBody}>
            <View
              style={[
                styles.errorIconWrap,
                saveError.kind === "network" && styles.errorIconWrapNetwork,
              ]}
            >
              <Ionicons
                name={
                  saveError.kind === "network"
                    ? "cloud-offline-outline"
                    : "alert-circle-outline"
                }
                size={44}
                color={
                  saveError.kind === "network" ? colors.info : colors.danger
                }
              />
            </View>
            <Text style={styles.errorModalMessage}>{saveError.message}</Text>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  bootText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  bootErrText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  bootErrActions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  backBtn: { marginLeft: -spacing.xs, paddingTop: spacing.xs },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  /** Mantiene montado el paso Elementos al cambiar de pestaña (no pierde chips). */
  elementsPanel: {
    flex: 1,
    minHeight: 0,
  },
  elementsPanelHidden: {
    display: "none",
  },
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
    fontStyle: "italic",
    textAlign: "center",
  },

  placeholderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  placeholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  detailPanel: {
    flex: 1,
    minHeight: 0,
  },
  thoughtPanel: {
    flex: 1,
    minHeight: 0,
  },

  errorModalBody: {
    alignItems: "center",
    gap: spacing.md,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232, 93, 106, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 93, 106, 0.25)",
  },
  errorIconWrapNetwork: {
    backgroundColor: "rgba(109, 179, 255, 0.12)",
    borderColor: "rgba(109, 179, 255, 0.28)",
  },
  errorModalMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
