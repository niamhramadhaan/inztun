import { Toast } from '../../../components/Toast';

export class TimestampTool {
  id = 'timestamp';
  name = 'Timestamp Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`;
  badge = 'Live';
  private interval: ReturnType<typeof setInterval> | null = null;
  private currentEl!: HTMLDivElement;
  private relativeEl!: HTMLDivElement;
  private unixEl!: HTMLInputElement;
  private humanEl!: HTMLInputElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="timestamp-display">
          <div class="timestamp-display__value" id="ts-current">0</div>
          <div class="timestamp-display__relative" id="ts-relative">&mdash;</div>
          <div class="timestamp-display__label">Current Unix Timestamp</div>
        </div>
        <div class="divider"></div>
        <div class="form-group">
          <label class="label">Unix Timestamp</label>
          <input class="input" id="ts-unix" type="text" placeholder="1234567890">
        </div>
        <div class="form-group">
          <label class="label">Human Readable</label>
          <input class="input" id="ts-human" type="text" placeholder="2024-01-15 12:00:00">
        </div>
        <div class="tool-actions">
          <button class="btn" id="ts-now">Use Current</button>
          <button class="btn btn--ghost" id="ts-copy">Copy Timestamp</button>
          <button class="btn btn--ghost" id="ts-copy-human">Copy Date</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.currentEl = root.querySelector('#ts-current') as HTMLDivElement;
    this.relativeEl = root.querySelector('#ts-relative') as HTMLDivElement;
    this.unixEl = root.querySelector('#ts-unix') as HTMLInputElement;
    this.humanEl = root.querySelector('#ts-human') as HTMLInputElement;

    this.updateCurrent();
    this.interval = setInterval(() => this.updateCurrent(), 1000);

    this.unixEl?.addEventListener('input', () => this.fromUnix());
    this.humanEl?.addEventListener('input', () => this.fromHuman());

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('ts-now', () => this.useCurrent());
    bind('ts-copy', () => {
      navigator.clipboard.writeText(this.unixEl.value || this.currentEl.textContent || '');
      Toast.copied('Timestamp');
    });
    bind('ts-copy-human', () => {
      navigator.clipboard.writeText(this.humanEl.value);
      Toast.copied('Date');
    });
  }

  updateCurrent(): void {
    const now = Math.floor(Date.now() / 1000);
    if (this.currentEl) this.currentEl.textContent = now.toString();
    if (this.relativeEl) this.relativeEl.textContent = 'just now';
  }

  fromUnix(): void {
    const unix = parseInt(this.unixEl.value);
    if (!isNaN(unix)) {
      const date = new Date(unix * 1000);
      this.humanEl.value = this.formatDate(date);
      this.updateRelative(date);
    }
  }

  fromHuman(): void {
    const date = new Date(this.humanEl.value);
    if (!isNaN(date.getTime())) {
      this.unixEl.value = Math.floor(date.getTime() / 1000).toString();
      this.updateRelative(date);
    }
  }

  useCurrent(): void {
    this.unixEl.value = Math.floor(Date.now() / 1000).toString();
    this.humanEl.value = this.formatDate(new Date());
    this.relativeEl.textContent = 'just now';
    Toast.info('Current time set');
  }

  updateRelative(date: Date): void {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    const absDiff = Math.abs(diff);

    let text: string;
    if (absDiff < 60) text = `${absDiff} seconds`;
    else if (absDiff < 3600) text = `${Math.floor(absDiff / 60)} minutes`;
    else if (absDiff < 86400) text = `${Math.floor(absDiff / 3600)} hours`;
    else if (absDiff < 2592000) text = `${Math.floor(absDiff / 86400)} days`;
    else if (absDiff < 31536000) text = `${Math.floor(absDiff / 2592000)} months`;
    else text = `${Math.floor(absDiff / 31536000)} years`;

    this.relativeEl.textContent = diff > 0 ? `${text} ago` : `in ${text}`;
  }

  formatDate(date: Date): string {
    const pad = (n: number): string => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  destroy(): void { if (this.interval) clearInterval(this.interval); }
}
