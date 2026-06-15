import { Toast } from '../../../components/Toast';

const POPULAR_ZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

export class TimezoneConverter {
  id = 'timezone-converter';
  name = 'Timezone Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
      <path d="M2 12h2M20 12h2M12 2v2M12 20v2" stroke-width="1"/>
    </svg>`;

  private timeInput!: HTMLInputElement;
  private zoneSelects: HTMLSelectElement[] = [];
  private displayEls: HTMLDivElement[] = [];
  private zonesContainer!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tz-controls">
          <div class="form-group" style="flex:1;">
            <label class="label">Time to Convert</label>
            <input type="datetime-local" class="input" id="tz-time" style="font-family:var(--font-mono);">
          </div>
        </div>
        <div class="tz-grid" id="tz-grid">
          ${[0, 1, 2, 3].map(i => `
            <div class="tz-card" id="tz-card-${i}">
              <select class="input tz-select" id="tz-zone-${i}" style="font-size:var(--text-xs);">
                ${POPULAR_ZONES.map((z, j) => `<option value="${z}" ${j === i ? 'selected' : ''}>${z.replace(/_/g, ' ')}</option>`).join('')}
              </select>
              <div class="tz-time" id="tz-display-${i}">—</div>
              <div class="tz-offset" id="tz-offset-${i}">—</div>
            </div>
          `).join('')}
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="tz-now">Use Current Time</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.timeInput = root.querySelector('#tz-time')!;
    this.zonesContainer = root.querySelector('#tz-grid')!;

    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    this.timeInput.value = local.toISOString().slice(0, 16);

    for (let i = 0; i < 4; i++) {
      this.zoneSelects.push(root.querySelector(`#tz-zone-${i}`)!);
      this.displayEls.push(root.querySelector(`#tz-display-${i}`)!);
    }

    const update = () => this.update();
    this.timeInput.addEventListener('input', update);
    this.zoneSelects.forEach(s => s.addEventListener('change', update));

    root.querySelector('#tz-now')!.addEventListener('click', () => {
      const n = new Date();
      const localN = new Date(n.getTime() - n.getTimezoneOffset() * 60000);
      this.timeInput.value = localN.toISOString().slice(0, 16);
      this.update();
    });

    this.update();
  }

  private update(): void {
    const value = this.timeInput.value;
    if (!value) return;

    for (let i = 0; i < 4; i++) {
      const zone = this.zoneSelects[i].value;
      try {
        const date = new Date(value);
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          hour: 'numeric', minute: '2-digit', hour12: true,
          weekday: 'short', month: 'short', day: 'numeric',
        });
        const offsetFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          timeZoneName: 'short',
        });
        const parts = offsetFormatter.formatToParts(date);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        this.displayEls[i].textContent = formatter.format(date);
        const offsetEl = document.querySelector(`#tz-offset-${i}`) as HTMLElement;
        if (offsetEl) offsetEl.textContent = tzPart?.value || zone;
      } catch {
        this.displayEls[i].textContent = 'Invalid zone';
      }
    }
  }

  destroy(): void {}
}
