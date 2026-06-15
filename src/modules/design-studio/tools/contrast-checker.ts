import { Toast } from '../../../components/Toast';

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

export class ContrastChecker {
  id = 'contrast-checker';
  name = 'WCAG Contrast Checker';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 0 20z"/>
    </svg>`;
  badge = 'Accessibility';

  private fgInput!: HTMLInputElement;
  private bgInput!: HTMLInputElement;
  private ratioEl!: HTMLDivElement;
  private badgesEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="cc-controls">
          <div class="form-group">
            <label class="label">Foreground (Text)</label>
            <div class="cc-color-row">
              <input type="color" id="cc-fg" value="#1a1a2e" class="cc-color-picker">
              <input type="text" class="input" id="cc-fg-hex" value="#1a1a2e" style="font-family:var(--font-mono);width:100px;">
            </div>
          </div>
          <button class="btn btn--ghost btn--sm cc-swap" id="cc-swap" title="Swap colors">⇄</button>
          <div class="form-group">
            <label class="label">Background</label>
            <div class="cc-color-row">
              <input type="color" id="cc-bg" value="#f0f0f0" class="cc-color-picker">
              <input type="text" class="input" id="cc-bg-hex" value="#f0f0f0" style="font-family:var(--font-mono);width:100px;">
            </div>
          </div>
        </div>
        <div class="cc-ratio" id="cc-ratio">—</div>
        <div class="cc-badges" id="cc-badges"></div>
        <div class="cc-preview" id="cc-preview">
          <p class="cc-preview__large">Large Text (18pt+)</p>
          <p class="cc-preview__normal">Normal text — The quick brown fox jumps over the lazy dog.</p>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="cc-copy">Copy Colors</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.fgInput = root.querySelector('#cc-fg')!;
    this.bgInput = root.querySelector('#cc-bg')!;
    this.ratioEl = root.querySelector('#cc-ratio')!;
    this.badgesEl = root.querySelector('#cc-badges')!;
    this.previewEl = root.querySelector('#cc-preview')!;

    const fgHex = root.querySelector('#cc-fg-hex') as HTMLInputElement;
    const bgHex = root.querySelector('#cc-bg-hex') as HTMLInputElement;

    this.fgInput.addEventListener('input', () => { fgHex.value = this.fgInput.value; this.update(); });
    this.bgInput.addEventListener('input', () => { bgHex.value = this.bgInput.value; this.update(); });
    fgHex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(fgHex.value)) { this.fgInput.value = fgHex.value; this.update(); } });
    bgHex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(bgHex.value)) { this.bgInput.value = bgHex.value; this.update(); } });

    root.querySelector('#cc-swap')!.addEventListener('click', () => {
      const tmp = this.fgInput.value;
      this.fgInput.value = this.bgInput.value;
      this.bgInput.value = tmp;
      fgHex.value = this.fgInput.value;
      bgHex.value = this.bgInput.value;
      this.update();
    });

    root.querySelector('#cc-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(`Foreground: ${this.fgInput.value}\nBackground: ${this.bgInput.value}`);
      Toast.copied('Colors');
    });

    this.update();
  }

  private update(): void {
    const [fr, fg, fb] = hexToRgb(this.fgInput.value);
    const [br, bg, bb] = hexToRgb(this.bgInput.value);
    const l1 = relativeLuminance(fr, fg, fb);
    const l2 = relativeLuminance(br, bg, bb);
    const ratio = contrastRatio(l1, l2);

    this.ratioEl.textContent = `${ratio.toFixed(2)} : 1`;
    this.ratioEl.className = 'cc-ratio ' + (ratio >= 4.5 ? 'cc-ratio--good' : ratio >= 3 ? 'cc-ratio--ok' : 'cc-ratio--bad');

    const checks = [
      { label: 'AA Normal', threshold: 4.5 },
      { label: 'AA Large', threshold: 3 },
      { label: 'AAA Normal', threshold: 7 },
      { label: 'AAA Large', threshold: 4.5 },
    ];

    this.badgesEl.innerHTML = checks.map(c => {
      const pass = ratio >= c.threshold;
      return `<span class="cc-badge ${pass ? 'cc-badge--pass' : 'cc-badge--fail'}">${c.label}: ${pass ? 'Pass' : 'Fail'}</span>`;
    }).join('');

    this.previewEl.style.background = this.bgInput.value;
    this.previewEl.style.color = this.fgInput.value;
  }

  destroy(): void {}
}
