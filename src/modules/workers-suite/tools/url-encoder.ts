import { Toast } from '../../../components/Toast';

export class UrlEncoder {
  id = 'url-encoder';
  name = 'URL Encoder/Decoder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>`;
  badge = '';
  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLPreElement;
  private partsEl!: HTMLDivElement;
  private countEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Input</label>
              <span class="char-count" id="ue-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="ue-input" placeholder="Enter URL or text..." spellcheck="false">https://example.com/path?name=hello world&lang=en</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Output</label>
            <pre class="input input--textarea" id="ue-output" style="min-height: 120px; overflow: auto; cursor: text;"></pre>
          </div>
        </div>
        <div class="url-parts" id="ue-parts"></div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="ue-encode">Encode</button>
          <button class="btn btn--primary" id="ue-decode">Decode</button>
          <button class="btn" id="ue-parse">Parse URL</button>
          <button class="btn btn--ghost" id="ue-copy">Copy</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#ue-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#ue-output') as HTMLPreElement;
    this.partsEl = root.querySelector('#ue-parts') as HTMLDivElement;
    this.countEl = root.querySelector('#ue-input-count') as HTMLSpanElement;

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('ue-encode', () => this.encode());
    bind('ue-decode', () => this.decode());
    bind('ue-parse', () => this.parseUrl());
    bind('ue-copy', () => {
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied();
    });

    this.inputEl?.addEventListener('input', () => this.updateCount());
    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  encode(): void {
    const input = this.inputEl.value;
    this.outputEl.textContent = encodeURIComponent(input);
    Toast.success('Encoded');
  }

  decode(): void {
    try {
      const input = this.inputEl.value;
      this.outputEl.textContent = decodeURIComponent(input);
      Toast.success('Decoded');
    } catch (e) {
      this.outputEl.textContent = `Error: ${(e as Error).message}`;
      Toast.error('Invalid encoding');
    }
  }

  parseUrl(): void {
    try {
      const input = this.inputEl.value.trim();
      const url = new URL(input);
      const params = Object.fromEntries(url.searchParams.entries());

      this.partsEl.innerHTML = `
        <div class="url-part"><span class="url-part__label">Protocol</span><span class="url-part__value">${url.protocol}</span></div>
        <div class="url-part"><span class="url-part__label">Host</span><span class="url-part__value">${url.host}</span></div>
        <div class="url-part"><span class="url-part__label">Hostname</span><span class="url-part__value">${url.hostname}</span></div>
        ${url.port ? `<div class="url-part"><span class="url-part__label">Port</span><span class="url-part__value">${url.port}</span></div>` : ''}
        <div class="url-part"><span class="url-part__label">Pathname</span><span class="url-part__value">${url.pathname}</span></div>
        <div class="url-part"><span class="url-part__label">Search</span><span class="url-part__value">${url.search || '(none)'}</span></div>
        ${Object.keys(params).length ? `
          <div class="url-part"><span class="url-part__label">Params</span>
            <div class="url-params">${Object.entries(params).map(([k, v]) => `<span class="url-param"><strong>${k}</strong>=${v}</span>`).join('')}</div>
          </div>
        ` : ''}
        ${url.hash ? `<div class="url-part"><span class="url-part__label">Hash</span><span class="url-part__value">${url.hash}</span></div>` : ''}
      `;
      this.outputEl.textContent = JSON.stringify({ protocol: url.protocol, host: url.host, pathname: url.pathname, params, hash: url.hash }, null, 2);
      Toast.success('URL parsed');
    } catch {
      this.partsEl.innerHTML = '';
      this.outputEl.textContent = `Error: Invalid URL`;
      Toast.error('Invalid URL');
    }
  }

  destroy(): void {}
}
