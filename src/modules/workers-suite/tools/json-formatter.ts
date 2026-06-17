import { Toast } from '../../../components/Toast';

export class JsonFormatter {
  id = 'json-formatter';
  name = 'JSON Formatter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7c0-1.1.9-2 2-2h8l4 4v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7z"/>
      <polyline points="14 2 14 6 18 6"/>
      <path d="M9 13h6M9 17h4"/>
    </svg>`;
  badge = 'Popular';
  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLPreElement;
  private countEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Input JSON</label>
              <span class="char-count" id="jf-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="jf-input" placeholder='{"key": "value"}' spellcheck="false"></textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Formatted Output</label>
            <pre class="input input--textarea" id="jf-output" style="min-height: 120px; overflow: auto; cursor: text;">{}</pre>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="jf-format">Format</button>
          <button class="btn" id="jf-minify">Minify</button>
          <button class="btn" id="jf-validate">Validate</button>
          <button class="btn btn--ghost" id="jf-copy">Copy</button>
          <button class="btn btn--ghost" id="jf-clear">Clear</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#jf-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#jf-output') as HTMLPreElement;
    this.countEl = root.querySelector('#jf-input-count') as HTMLSpanElement;

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('jf-format', () => this.format());
    bind('jf-minify', () => this.minify());
    bind('jf-validate', () => this.validate());
    bind('jf-copy', () => this.copy());
    bind('jf-clear', () => this.clear());

    this.inputEl?.addEventListener('input', () => this.updateCount());
    this.inputEl?.addEventListener('paste', () => setTimeout(() => this.format(), 100));
    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  format(): void {
    try {
      const input = this.inputEl.value.trim();
      if (!input) return;
      this.outputEl.textContent = JSON.stringify(JSON.parse(input), null, 2);
      this.outputEl.style.color = 'var(--text-primary)';
      Toast.success('Formatted');
    } catch (e) {
      this.outputEl.textContent = `Error: ${(e as Error).message}`;
      this.outputEl.style.color = 'var(--color-error)';
      Toast.error('Invalid JSON');
    }
  }

  minify(): void {
    try {
      const input = this.inputEl.value.trim();
      if (!input) return;
      this.outputEl.textContent = JSON.stringify(JSON.parse(input));
      this.outputEl.style.color = 'var(--text-primary)';
      Toast.success('Minified');
    } catch (e) {
      this.outputEl.textContent = `Error: ${(e as Error).message}`;
      this.outputEl.style.color = 'var(--color-error)';
      Toast.error('Invalid JSON');
    }
  }

  validate(): void {
    try {
      const input = this.inputEl.value.trim();
      if (!input) return;
      JSON.parse(input);
      this.outputEl.textContent = '\u2713 Valid JSON';
      this.outputEl.style.color = 'var(--color-success)';
      Toast.success('Valid JSON');
    } catch (e) {
      this.outputEl.textContent = `\u2717 Invalid: ${(e as Error).message}`;
      this.outputEl.style.color = 'var(--color-error)';
      Toast.error('Invalid JSON');
    }
  }

  async copy(): Promise<void> {
    const text = this.outputEl.textContent;
    if (text && !text.startsWith('Error')) {
      await navigator.clipboard.writeText(text);
      Toast.copied();
    }
  }

  clear(): void {
    this.inputEl.value = '';
    this.outputEl.textContent = '{}';
    this.outputEl.style.color = 'var(--text-primary)';
    this.updateCount();
  }

  destroy(): void {}
}
