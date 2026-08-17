// ── Tier 1 — primitives ──────────────────────────────────────────────────

export { Button } from './button/button';
export type { ButtonVariant } from './button/button';

export { Input } from './input/input';
export type { InputFieldType } from './input/input';

export { Textarea } from './textarea/textarea';

export { StatusBadge } from './status-badge/status-badge';
export type { DreamStatus } from './status-badge/status-badge';

export { Chip } from './chip/chip';
export type { ChipTone } from './chip/chip';

export { AsyncState } from './async-state/async-state';

export { PageHeader } from './page-header/page-header';

export { Switch } from './switch/switch';

export { Radio } from './radio/radio';

export { Slider } from './slider/slider';

export { DateField } from './date-field/date-field';

export { Toast } from './toast/toast';
export type { ToastTone } from './toast/toast';

export { Pager } from './pager/pager';
export type { PagerItemContext } from './pager/pager';

export { Select } from './select/select';
export type { SelectOption } from './select/select';

// ── Tier 2 — Dreamia domain components ──────────────────────────────────

export type { EntityKind } from './dream/entity-kind';
export { ENTITY_LABEL, ENTITY_KINDS } from './dream/entity-kind';

export { DreamCard } from './dream/dream-card/dream-card';

export { EntityCard } from './dream/entity-card/entity-card';

export { Tabs } from './dream/tabs/tabs';
export type { TabItem } from './dream/tabs/tabs';

export { LucidityHistogram } from './dream/lucidity-histogram/lucidity-histogram';
export type { LucidityBin } from './dream/lucidity-histogram/lucidity-histogram';

export { TopEntityList } from './dream/top-entity-list/top-entity-list';
export type { TopEntityRow } from './dream/top-entity-list/top-entity-list';

export { HeroImageCarousel } from './dream/hero-image-carousel/hero-image-carousel';

export { ImageUploadField } from './dream/image-upload-field/image-upload-field';

export { MarkdownRenderer } from './dream/markdown-renderer/markdown-renderer';

export { SearchAndAttach } from './dream/search-and-attach/search-and-attach';
export type { SearchAndAttachOption } from './dream/search-and-attach/search-and-attach';

export { EntityForm } from './dream/entity-form/entity-form';
export type { EntityFormValue, EntityFormSaveEvent } from './dream/entity-form/entity-form';

export {
  ENTITY_FIELD_CONFIG,
  ENTITY_KIND_TO_API_PATH,
  ENTITY_KIND_REQUIRES_DREAM_SESSION,
} from './dream/entity-kind';
export type { EntityFieldConfig, EntityFieldType } from './dream/entity-kind';
