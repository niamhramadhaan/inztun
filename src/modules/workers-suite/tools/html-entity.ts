import { Toast } from '../../../components/Toast';

export class HtmlEntityEncoder {
  id = 'html-entity';
  name = 'HTML Entity Encoder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
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
              <label class="label">Input</label>
              <span class="char-count" id="he-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="he-input" placeholder="Enter text or HTML entities..." spellcheck="false">Hello <b>World</b> & "friends"</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Output</label>
            <pre class="input input--textarea" id="he-output" style="min-height: 120px; overflow: auto; cursor: text;"></pre>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="he-encode">Encode</button>
          <button class="btn btn--primary" id="he-decode">Decode</button>
          <button class="btn btn--ghost" id="he-copy">Copy</button>
          <button class="btn btn--ghost" id="he-clear">Clear</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#he-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#he-output') as HTMLPreElement;
    this.countEl = root.querySelector('#he-input-count') as HTMLSpanElement;

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('he-encode', () => this.encode());
    bind('he-decode', () => this.decode());
    bind('he-copy', () => {
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied();
    });
    bind('he-clear', () => {
      this.inputEl.value = '';
      this.outputEl.textContent = '';
      this.updateCount();
    });

    this.inputEl?.addEventListener('input', () => this.updateCount());
    this.encode();
    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  encode(): void {
    const input = this.inputEl.value;
    const encoded = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    this.outputEl.textContent = encoded;
    Toast.success('Encoded');
  }

  decode(): void {
    const input = this.inputEl.value;
    const decoded = input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_match: string, dec: string) => String.fromCharCode(parseInt(dec)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_match: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    this.outputEl.textContent = decoded;
    Toast.success('Decoded');
  }

  destroy(): void {}
}
