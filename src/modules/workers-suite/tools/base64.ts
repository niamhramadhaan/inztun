import { Toast } from '../../../components/Toast';

export class Base64Tool {
  id = 'base64';
  name = 'Base64 Encoder/Decoder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
      <line x1="14" y1="4" x2="10" y2="20"/>
    </svg>`;
  badge = '';
  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLPreElement;
  private countEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Input Text</label>
              <span class="char-count" id="b64-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="b64-input" placeholder="Enter text or Base64..." spellcheck="false"></textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Output</label>
            <pre class="input input--textarea" id="b64-output" style="min-height: 120px; overflow: auto; cursor: text;"></pre>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="b64-encode">Encode</button>
          <button class="btn btn--primary" id="b64-decode">Decode</button>
          <button class="btn btn--ghost" id="b64-copy">Copy</button>
          <button class="btn btn--ghost" id="b64-clear">Clear</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#b64-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#b64-output') as HTMLPreElement;
    this.countEl = root.querySelector('#b64-input-count') as HTMLSpanElement;

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('b64-encode', () => this.encode());
    bind('b64-decode', () => this.decode());
    bind('b64-copy', () => this.copy());
    bind('b64-clear', () => this.clear());

    this.inputEl?.addEventListener('input', () => this.updateCount());
    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  encode(): void {
    try {
      const input = this.inputEl.value;
      if (!input) return;
      this.outputEl.textContent = btoa(unescape(encodeURIComponent(input)));
      this.outputEl.style.color = 'var(--text-primary)';
      Toast.success('Encoded');
    } catch (e) {
      this.outputEl.textContent = `Error: ${(e as Error).message}`;
      this.outputEl.style.color = 'var(--color-error)';
      Toast.error('Encoding failed');
    }
  }

  decode(): void {
    try {
      const input = this.inputEl.value.trim();
      if (!input) return;
      this.outputEl.textContent = decodeURIComponent(escape(atob(input)));
      this.outputEl.style.color = 'var(--text-primary)';
      Toast.success('Decoded');
    } catch {
      this.outputEl.textContent = `Error: Invalid Base64 string`;
      this.outputEl.style.color = 'var(--color-error)';
      Toast.error('Invalid Base64');
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
    this.outputEl.textContent = '';
    this.updateCount();
  }

  destroy(): void {}
}
