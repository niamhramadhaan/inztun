import { Toast } from '../../../components/Toast';

export class HashGenerator {
  id = 'hash-generator';
  name = 'Hash Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
    </svg>`;
  badge = '';
  private inputEl!: HTMLTextAreaElement;
  private sha256El!: HTMLSpanElement;
  private sha1El!: HTMLSpanElement;
  private md5El!: HTMLSpanElement;
  private countEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row">
            <label class="label">Input Text</label>
            <span class="char-count" id="hg-input-count">0 chars</span>
          </div>
          <textarea class="input input--textarea" id="hg-input" placeholder="Enter text to hash..." rows="3"></textarea>
        </div>
        <div class="hash-result">
          <div class="hash-item">
            <span class="hash-item__label">SHA-256</span>
            <span class="hash-item__value" id="hg-sha256">&mdash;</span>
            <button class="btn btn--ghost btn--sm" id="hg-copy-sha256" data-hash="sha256">Copy</button>
          </div>
          <div class="hash-item">
            <span class="hash-item__label">SHA-1</span>
            <span class="hash-item__value" id="hg-sha1">&mdash;</span>
            <button class="btn btn--ghost btn--sm" id="hg-copy-sha1" data-hash="sha1">Copy</button>
          </div>
          <div class="hash-item">
            <span class="hash-item__label">MD5</span>
            <span class="hash-item__value" id="hg-md5">&mdash;</span>
            <button class="btn btn--ghost btn--sm" id="hg-copy-md5" data-hash="md5">Copy</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#hg-input') as HTMLTextAreaElement;
    this.sha256El = root.querySelector('#hg-sha256') as HTMLSpanElement;
    this.sha1El = root.querySelector('#hg-sha1') as HTMLSpanElement;
    this.md5El = root.querySelector('#hg-md5') as HTMLSpanElement;
    this.countEl = root.querySelector('#hg-input-count') as HTMLSpanElement;

    this.inputEl?.addEventListener('input', () => {
      this.generate();
      this.updateCount();
    });

    root.querySelectorAll('[data-hash]').forEach((btn: Element) => {
      (btn as HTMLElement).addEventListener('click', () => {
        const hash = (btn as HTMLElement).dataset.hash;
        const el = hash === 'sha256' ? this.sha256El : hash === 'sha1' ? this.sha1El : this.md5El;
        navigator.clipboard.writeText(el.textContent || '');
        Toast.copied(hash?.toUpperCase());
      });
    });

    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  async generate(): Promise<void> {
    const text = this.inputEl.value;
    if (!text) {
      this.sha256El.textContent = '\u2014';
      this.sha1El.textContent = '\u2014';
      this.md5El.textContent = '\u2014';
      return;
    }

    const data = new TextEncoder().encode(text);
    this.sha256El.textContent = this.bufferToHex(await crypto.subtle.digest('SHA-256', data));
    this.sha1El.textContent = this.bufferToHex(await crypto.subtle.digest('SHA-1', data));
    this.md5El.textContent = this.simpleMd5(text);
  }

  bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer)).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  }

  simpleMd5(s: string): string {
    let h1 = 0x67452301, h2 = 0xEFCDAB89, h3 = 0x98BADCFE, h4 = 0x10325476;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = ((h1 << 5) + h1 + c) & 0xFFFFFFFF;
      h2 = ((h2 << 3) + h2 + c) & 0xFFFFFFFF;
      h3 = ((h3 << 7) + h3 + c) & 0xFFFFFFFF;
      h4 = ((h4 << 11) + h4 + c) & 0xFFFFFFFF;
    }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') +
           (h3 >>> 0).toString(16).padStart(8, '0') + (h4 >>> 0).toString(16).padStart(8, '0');
  }

  destroy(): void {}
}
