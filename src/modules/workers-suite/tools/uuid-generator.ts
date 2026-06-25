import { Toast } from '../../../components/Toast';
import { copyToClipboard } from '../../../utils/image';

export class UuidGenerator {
  id = 'uuid-generator';
  name = 'UUID Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`;
  badge = '';
  private listEl!: HTMLDivElement;
  private countEl!: HTMLInputElement;
  private formatEl!: HTMLSelectElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="uuid-controls">
          <div class="form-group">
            <label class="label">Count</label>
            <input class="input" id="uuid-count" type="number" value="5" min="1" max="100" style="width: 80px;">
          </div>
          <div class="form-group">
            <label class="label">Format</label>
            <select class="input" id="uuid-format" style="width: 120px;">
              <option value="lower">Lowercase</option>
              <option value="upper">Uppercase</option>
              <option value="braces">{With Braces}</option>
            </select>
          </div>
        </div>
        <div class="tool-area" id="uuid-list" style="flex: 1; overflow-y: auto;"></div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="uuid-generate">Generate</button>
          <button class="btn btn--ghost" id="uuid-copy-all">Copy All</button>
          <button class="btn btn--ghost" id="uuid-download">Download .txt</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.listEl = root.querySelector('#uuid-list') as HTMLDivElement;
    this.countEl = root.querySelector('#uuid-count') as HTMLInputElement;
    this.formatEl = root.querySelector('#uuid-format') as HTMLSelectElement;

    const bind = (id: string, fn: () => void): void =>
      root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('uuid-generate', () => this.generate());
    bind('uuid-copy-all', () => this.copyAll());
    bind('uuid-download', () => this.download());
    this.generate();
  }

  generate(): void {
    const count = parseInt(this.countEl.value) || 5;
    const format = this.formatEl.value;
    const uuids = Array.from({ length: count }, () => this.formatUuid(this.v4(), format));

    this.listEl.innerHTML = `<div class="uuid-list">${uuids
      .map(
        (uuid: string) => `
      <div class="uuid-item">
        <span>${uuid}</span>
        <button class="btn btn--ghost btn--sm uuid-copy-btn">Copy</button>
      </div>`,
      )
      .join('')}</div>`;

    this.listEl.querySelectorAll('.uuid-copy-btn').forEach((btn: Element, i: number) => {
      (btn as HTMLElement).addEventListener('click', () => {
        void copyToClipboard(uuids[i]);
        Toast.copied('UUID');
      });
    });
  }

  formatUuid(uuid: string, format: string): string {
    switch (format) {
      case 'upper':
        return uuid.toUpperCase();
      case 'braces':
        return `{${uuid}}`;
      default:
        return uuid;
    }
  }

  v4(): string {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  async copyAll(): Promise<void> {
    const items = this.listEl.querySelectorAll('.uuid-item span');
    await copyToClipboard(
      Array.from(items)
        .map((el: Element) => el.textContent || '')
        .join('\n'),
    );
    Toast.copied('All UUIDs');
  }

  download(): void {
    const items = this.listEl.querySelectorAll('.uuid-item span');
    const text = Array.from(items)
      .map((el: Element) => el.textContent || '')
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `[Inztun] uuids-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Downloaded');
  }

  destroy(): void {}
}
