import { Toast } from '../../../components/Toast.js';

export class HtmlEntityEncoder {
  constructor() {
    this.id = 'html-entity';
    this.name = 'HTML Entity Encoder';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>`;
    this.badge = '';
  }

  render() {
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

  init(root) {
    this.inputEl = root.querySelector('#he-input');
    this.outputEl = root.querySelector('#he-output');
    this.countEl = root.querySelector('#he-input-count');

    const bind = (id, fn) => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('he-encode', () => this.encode());
    bind('he-decode', () => this.decode());
    bind('he-copy', () => {
      navigator.clipboard.writeText(this.outputEl.textContent);
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

  updateCount() {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  encode() {
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

  decode() {
    const input = this.inputEl.value;
    const decoded = input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    this.outputEl.textContent = decoded;
    Toast.success('Decoded');
  }

  destroy() {}
}
