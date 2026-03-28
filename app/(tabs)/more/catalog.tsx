import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Badge,
  badgeLabelStyle,
  Button,
  Checkbox,
  Input,
  KeyboardAvoidingScroll,
  Modal,
  Radio,
  Select,
  type SelectOption,
  Slider,
  Switch,
  Textarea,
} from '@/components/ui';
import { colors, gradients, radius, spacing, typography } from '@/theme';

type CatalogTab =
  | 'buttons'
  | 'inputs'
  | 'badges'
  | 'select'
  | 'switches'
  | 'extra';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const THEME_OPTIONS: SelectOption[] = [
  { value: 'dark', label: 'Oscuro (solo)' },
  { value: 'system', label: 'Según sistema' },
];

export default function CatalogScreen() {
  const bg = gradients.background;
  const [tab, setTab] = useState<CatalogTab>('buttons');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [themePref, setThemePref] = useState<string | null>('dark');
  const [notes, setNotes] = useState('');
  const [swNotif, setSwNotif] = useState(true);
  const [swHaptics, setSwHaptics] = useState(false);
  const [swDisabled] = useState(false);
  const [cbA, setCbA] = useState(false);
  const [cbB, setCbB] = useState(true);
  const [radioPet, setRadioPet] = useState<'dog' | 'cat' | 'bird'>('dog');
  const [sliderVal, setSliderVal] = useState(42);
  const [sliderFine, setSliderFine] = useState(0.35);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <KeyboardAvoidingScroll
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Catálogo</Text>
          <Text style={styles.screenSubtitle}>Componentes UI</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'buttons' }}
              onPress={() => setTab('buttons')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'buttons' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'buttons' && styles.tabLabelActive,
                ]}
              >
                Botones
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'inputs' }}
              onPress={() => setTab('inputs')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'inputs' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'inputs' && styles.tabLabelActive,
                ]}
              >
                Inputs
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'badges' }}
              onPress={() => setTab('badges')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'badges' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'badges' && styles.tabLabelActive,
                ]}
              >
                Badges
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'select' }}
              onPress={() => setTab('select')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'select' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'select' && styles.tabLabelActive,
                ]}
              >
                Select
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'switches' }}
              onPress={() => setTab('switches')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'switches' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'switches' && styles.tabLabelActive,
                ]}
              >
                Switch
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'extra' }}
              onPress={() => setTab('extra')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'extra' && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'extra' && styles.tabLabelActive,
                ]}
              >
                Más
              </Text>
            </Pressable>
          </ScrollView>

          {tab === 'buttons' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Color puro en el gradiente (sin blanco)
              </Text>
              <View style={styles.stack}>
                <Button variant="yellow">Amarillo</Button>
                <Button variant="red">Rojo</Button>
                <Button variant="blue">Azul</Button>
                <Button variant="green">Verde</Button>
                <Button variant="purple">Morado</Button>
                <Button variant="teal">Teal</Button>
                <Button variant="orange">Naranja</Button>
                <Button variant="rose">Rosa</Button>
                <Button variant="indigo">Índigo</Button>
              </View>
            </View>
          ) : tab === 'inputs' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Mismo borde morado que los botones; foco en acento
              </Text>
              <View style={styles.stack}>
                <Input
                  label="Email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Input
                  label="Con ayuda"
                  placeholder="Escribe algo…"
                  hint="Texto opcional debajo del campo."
                />
                <Input
                  label="Con error"
                  placeholder="Campo inválido"
                  error="Este campo es obligatorio."
                />
                <Input
                  label="Deshabilitado"
                  placeholder="No editable"
                  editable={false}
                  value="Valor fijo"
                />
                <Input
                  label="Contraseña"
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Textarea
                  label="Notas"
                  placeholder="Texto largo…"
                  value={notes}
                  onChangeText={setNotes}
                  hint="Multilínea; mismo estilo que Input."
                />
                <Textarea
                  label="Con límite de altura"
                  placeholder="Mucho texto hace scroll dentro del campo…"
                  maxHeight={160}
                />
                <Textarea
                  label="Textarea con error"
                  placeholder="Vacío"
                  value=""
                  onChangeText={() => {}}
                  error="Añade al menos una frase."
                />
              </View>
            </View>
          ) : tab === 'badges' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Metal brillante tipo logro (oro, plata, bronce, rubí, esmeralda)
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.badgeItem}>
                  <Badge variant="gold" size="lg">
                    <Text style={badgeLabelStyle}>🏆</Text>
                  </Badge>
                  <Text style={styles.badgeCaption}>Oro</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Badge variant="silver" size="lg">
                    <Text style={badgeLabelStyle}>🥈</Text>
                  </Badge>
                  <Text style={styles.badgeCaption}>Plata</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Badge variant="bronze" size="lg">
                    <Text style={badgeLabelStyle}>🥉</Text>
                  </Badge>
                  <Text style={styles.badgeCaption}>Bronce</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Badge variant="ruby" size="lg">
                    <Text style={badgeLabelStyle}>💎</Text>
                  </Badge>
                  <Text style={styles.badgeCaption}>Rubí</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Badge variant="emerald" size="lg">
                    <Text style={badgeLabelStyle}>✨</Text>
                  </Badge>
                  <Text style={styles.badgeCaption}>Esmeralda</Text>
                </View>
              </View>
            </View>
          ) : tab === 'select' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Mismo estilo que Input; lista en modal inferior
              </Text>
              <View style={styles.stack}>
                <Select
                  label="Idioma"
                  placeholder="Elige un idioma"
                  options={LANGUAGE_OPTIONS}
                  value={language}
                  onValueChange={setLanguage}
                  modalTitle="Idioma"
                  hint="Lista con check en la opción activa."
                />
                <Select
                  label="Apariencia"
                  options={THEME_OPTIONS}
                  value={themePref}
                  onValueChange={setThemePref}
                  modalTitle="Apariencia"
                />
                <Select
                  label="Con error"
                  placeholder="Selecciona…"
                  options={LANGUAGE_OPTIONS}
                  value={null}
                  onValueChange={() => {}}
                  error="Debes elegir una opción."
                />
              </View>
            </View>
          ) : tab === 'switches' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Interruptores nativos con colores del tema
              </Text>
              <View style={styles.stack}>
                <Switch
                  label="Notificaciones"
                  value={swNotif}
                  onValueChange={setSwNotif}
                  hint="Activa o desactiva avisos."
                />
                <Switch
                  label="Haptics"
                  value={swHaptics}
                  onValueChange={setSwHaptics}
                />
                <Switch
                  label="Solo lectura (deshabilitado)"
                  value={swDisabled}
                  onValueChange={() => {}}
                  disabled
                />
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>
                Checkbox, radio, slider y modal centrado
              </Text>

              <Text style={styles.subsectionLabel}>Checkbox</Text>
              <View style={styles.stack}>
                <Checkbox
                  label="Opción A"
                  checked={cbA}
                  onCheckedChange={setCbA}
                />
                <Checkbox
                  label="Opción B (marcada por defecto)"
                  checked={cbB}
                  onCheckedChange={setCbB}
                  hint="Puedes combinar con validación."
                />
                <Checkbox
                  label="Deshabilitado"
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled
                />
              </View>

              <Text style={styles.subsectionLabel}>Radio</Text>
              <View style={styles.stack}>
                <Radio
                  label="Perro"
                  selected={radioPet === 'dog'}
                  onPress={() => setRadioPet('dog')}
                />
                <Radio
                  label="Gato"
                  selected={radioPet === 'cat'}
                  onPress={() => setRadioPet('cat')}
                />
                <Radio
                  label="Pájaro"
                  selected={radioPet === 'bird'}
                  onPress={() => setRadioPet('bird')}
                />
              </View>

              <Text style={styles.subsectionLabel}>Slider</Text>
              <View style={styles.stack}>
                <Slider
                  label="Valor 0–100"
                  value={sliderVal}
                  onValueChange={setSliderVal}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                />
                <Slider
                  label="0–1 (paso 0.01)"
                  value={sliderFine}
                  onValueChange={setSliderFine}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.01}
                  formatValue={(v) => v.toFixed(2)}
                />
              </View>

              <Text style={styles.subsectionLabel}>Modal</Text>
              <View style={styles.stack}>
                <Button
                  variant="teal"
                  onPress={() => setModalOpen(true)}
                >
                  Abrir modal
                </Button>
              </View>

              <Modal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Ejemplo de modal"
                closeLabel="Listo"
              >
                <Text style={styles.modalBody}>
                  Contenido arbitrario: texto, formulario o lo que necesites.
                </Text>
              </Modal>
            </View>
          )}
        </KeyboardAvoidingScroll>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  screenTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  screenSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingRight: spacing.xl,
  },
  tab: {
    minWidth: 76,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  tabPressed: {
    opacity: 0.85,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHint: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  subsectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  modalBody: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  stack: {
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
    rowGap: spacing.xl,
  },
  badgeItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 88,
  },
  badgeCaption: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
