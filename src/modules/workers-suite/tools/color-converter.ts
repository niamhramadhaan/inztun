import { Toast } from '../../../components/Toast';

export class ColorConverter {
  id = 'color-converter';
  name = 'Color Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
    </svg>`;
  badge = '';
  private hexInput!: HTMLInputElement;
  private picker!: HTMLInputElement;
  private preview!: HTMLDivElement;
  private rgbDisplay!: HTMLSpanElement;
  private hslDisplay!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="color-preview" id="cc-preview" style="background: rgb(201, 169, 110);"></div>
        <div class="color-picker-row">
          <input type="color" id="cc-picker" value="#c9a96e" class="color-native-picker">
          <div class="form-group" style="flex: 1;">
            <label class="label">HEX</label>
            <input class="input" id="cc-hex" type="text" value="#c9a96e" placeholder="#000000">
          </div>
        </div>
        <div class="color-values">
          <div class="color-value">
            <span class="color-value__label">RGB</span>
            <span class="color-value__text" id="cc-rgb">rgb(201, 169, 110)</span>
          </div>
          <div class="color-value">
            <span class="color-value__label">HSL</span>
            <span class="color-value__text" id="cc-hsl">hsl(39, 43%, 61%)</span>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="cc-copy-hex">Copy HEX</button>
          <button class="btn btn--ghost" id="cc-copy-rgb">Copy RGB</button>
          <button class="btn btn--ghost" id="cc-copy-hsl">Copy HSL</button>
          <button class="btn btn--ghost" id="cc-random">Random</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.hexInput = root.querySelector('#cc-hex') as HTMLInputElement;
    this.picker = root.querySelector('#cc-picker') as HTMLInputElement;
    this.preview = root.querySelector('#cc-preview') as HTMLDivElement;
    this.rgbDisplay = root.querySelector('#cc-rgb') as HTMLSpanElement;
    this.hslDisplay = root.querySelector('#cc-hsl') as HTMLSpanElement;

    this.hexInput?.addEventListener('input', (e: Event) => this.updateFromHex((e.target as HTMLInputElement).value));
    this.picker?.addEventListener('input', (e: Event) => {
      this.hexInput.value = (e.target as HTMLInputElement).value;
      this.updateFromHex((e.target as HTMLInputElement).value);
    });

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('cc-copy-hex', () => {
      navigator.clipboard.writeText(this.hexInput.value);
      Toast.copied('HEX');
    });
    bind('cc-copy-rgb', () => {
      navigator.clipboard.writeText(this.rgbDisplay.textContent || '');
      Toast.copied('RGB');
    });
    bind('cc-copy-hsl', () => {
      navigator.clipboard.writeText(this.hslDisplay.textContent || '');
      Toast.copied('HSL');
    });
    bind('cc-random', () => {
      const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      this.hexInput.value = hex;
      this.picker.value = hex;
      this.updateFromHex(hex);
      Toast.info('Random color');
    });
  }

  updateFromHex(hex: string): void {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    this.preview.style.background = hex;
    this.picker.value = hex;
    this.rgbDisplay.textContent = `rgb(${r}, ${g}, ${b})`;
    this.hslDisplay.textContent = this.toHSL(r, g, b);
  }

  toHSL(r: number, g: number, b: number): string {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h: number, s: number; const l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
      const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  destroy(): void {}
}
