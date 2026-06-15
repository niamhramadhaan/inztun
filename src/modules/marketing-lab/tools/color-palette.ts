import { Toast } from '../../../components/Toast';

interface Palette {
  name: string;
  colors: string[];
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export class ColorPalette {
  id = 'color-palette';
  name = 'Color Palette Extractor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="8" r="2" fill="currentColor"/>
      <circle cx="8" cy="14" r="2" fill="currentColor"/>
      <circle cx="16" cy="14" r="2" fill="currentColor"/>
    </svg>`;
  badge = '';
  private colorInput!: HTMLInputElement;
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Base Color</label>
          <div class="mlc-input-row">
            <input type="color" id="mlc-color" value="#c9a96e" class="dsb-color-input">
            <input type="text" id="mlc-hex" value="#c9a96e" class="input" style="width:120px" maxlength="7">
          </div>
        </div>
        <div class="mlc-palettes" id="mlc-palettes"></div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="mlc-copy-css">Copy CSS</button>
        </div>
        <pre class="input input--textarea" id="mlc-output" style="min-height:80px;cursor:text;"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.colorInput = root.querySelector('#mlc-color')!;
    const hexInput = root.querySelector('#mlc-hex') as HTMLInputElement;
    this.previewEl = root.querySelector('#mlc-palettes')!;
    this.outputEl = root.querySelector('#mlc-output')!;

    this.colorInput.addEventListener('input', () => {
      hexInput.value = this.colorInput.value;
      this.update();
    });

    hexInput.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(hexInput.value)) {
        this.colorInput.value = hexInput.value;
        this.update();
      }
    });

    root.querySelector('#mlc-copy-css')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied('CSS');
    });

    this.update();
  }

  private generatePalettes(hex: string): Palette[] {
    const [h, s, l] = hexToHsl(hex);
    return [
      { name: 'Analogous', colors: [hslToHex((h - 30 + 360) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)] },
      { name: 'Complementary', colors: [hex, hslToHex((h + 180) % 360, s, l)] },
      { name: 'Triadic', colors: [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)] },
      { name: 'Split Complementary', colors: [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)] },
      { name: 'Shades', colors: [0.2, 0.35, 0.5, 0.65, 0.8].map((lt) => hslToHex(h, s, Math.round(lt * 100))) },
    ];
  }

  private update(): void {
    const hex = this.colorInput.value;
    const palettes = this.generatePalettes(hex);

    this.previewEl.innerHTML = palettes.map(p => `
      <div class="mlc-palette">
        <span class="mlc-palette__name">${p.name}</span>
        <div class="mlc-swatches">
          ${p.colors.map(c => `
            <div class="mlc-swatch" style="background:${c}" data-color="${c}" title="Click to copy ${c}">
              <span class="mlc-swatch__label">${c}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    this.previewEl.querySelectorAll('.mlc-swatch').forEach(el => {
      el.addEventListener('click', () => {
        navigator.clipboard.writeText((el as HTMLElement).dataset.color!);
        Toast.copied('Color');
      });
    });

    let css = ':root {\n';
    palettes.forEach(p => {
      p.colors.forEach((c, i) => {
        css += `  --${p.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}: ${c};\n`;
      });
    });
    css += '}';
    this.outputEl.textContent = css;
  }

  destroy(): void {}
}
