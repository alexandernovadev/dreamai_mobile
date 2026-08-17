import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

/**
 * Preview + pick + drag-drop + remove. Does NOT perform the upload itself —
 * it emits the raw `File` via `fileSelected` and lets the parent talk to
 * whatever upload service is wired up (Cloudinary, etc.), then set `value`
 * (or toggle `loading`) once that resolves. Keeps this component free of
 * any backend/service dependency.
 */
@Component({
  selector: 'app-image-upload-field',
  templateUrl: './image-upload-field.html',
  styleUrl: './image-upload-field.scss',
})
export class ImageUploadField {
  readonly label = input<string | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);

  /** The confirmed/remote image URL, once uploaded. */
  readonly value = model<string | null>(null);

  readonly fileSelected = output<File>();
  readonly cleared = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly localPreview = signal<string | null>(null);
  private localObjectUrl: string | null = null;

  protected readonly isDragging = signal(false);
  protected readonly displayUrl = computed(() => this.localPreview() ?? this.value());

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeLocalObjectUrl());
  }

  protected onDropzoneClick(input: HTMLInputElement): void {
    if (this.disabled() || this.loading()) return;
    input.click();
  }

  protected onFileInputChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.acceptFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled() || this.loading()) return;
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.disabled() || this.loading()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.acceptFile(file);
  }

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.revokeLocalObjectUrl();
    this.localPreview.set(null);
    this.value.set(null);
    this.cleared.emit();
  }

  private acceptFile(file: File): void {
    this.revokeLocalObjectUrl();
    this.localObjectUrl = URL.createObjectURL(file);
    this.localPreview.set(this.localObjectUrl);
    this.fileSelected.emit(file);
  }

  private revokeLocalObjectUrl(): void {
    if (this.localObjectUrl) {
      URL.revokeObjectURL(this.localObjectUrl);
      this.localObjectUrl = null;
    }
  }
}
