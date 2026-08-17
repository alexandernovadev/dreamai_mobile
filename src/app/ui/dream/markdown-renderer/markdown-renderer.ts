import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { marked } from 'marked';

marked.setOptions({ breaks: true });

/**
 * Renders AI-generated markdown (e.g. `POST /dream-sessions/ai/summarize-recent`).
 * `[innerHTML]` goes through Angular's DomSanitizer automatically — no raw HTML
 * from the model ever reaches the DOM unsanitized.
 *
 * `ViewEncapsulation.None`: the markup comes from `marked`, not Angular's
 * template compiler, so it never gets the `_ngcontent` attribute emulated
 * encapsulation relies on — scoped styles would silently never match it.
 */
@Component({
  selector: 'app-markdown-renderer',
  templateUrl: './markdown-renderer.html',
  styleUrl: './markdown-renderer.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownRenderer {
  readonly content = input.required<string>();

  protected readonly html = computed(() => marked.parse(this.content(), { async: false }));
}
