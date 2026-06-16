import { Toast } from '../../../components/Toast';
import { ICONS } from '../../../core/icons';
import type { Tool } from '../../../types';

interface Shape {
  type: 'rect' | 'circle' | 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface IconLayer {
  source: 'icon' | 'text';
  iconKey: string;
  text: string;
  color: string;
  size: number;
  fontFamily: string;
}

const SHAPES: Shape[] = [
  { type: 'rect', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'circle', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'triangle', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
];

const ICON_KEYS = ['home', 'workers', 'design', 'marketing', 'freelance', 'json', 'hash', 'uuid', 'password', 'gradient', 'palette', 'invoice', 'clients', 'search', 'settings'];

const FONTS = ['monospace', 'Georgia, serif', 'Arial, sans-serif', 'Courier New, monospace', 'Verdana, sans-serif'];

export class LogoBuilder implements Tool {
  id = 'logo-builder';
  name = 'Logo Builder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 7v10M7 12h10"/>
    </svg>`;
  badge = '';

  private canvasSize = 256;
  private shape: Shape = { ...SHAPES[0] };
  private iconLayer: IconLayer = {
    source: 'icon',
    iconKey: 'home',
    text: 'LOGO',
    color: '#1a1a1a',
    size: 80,
    fontFamily: 'monospace',
  };
  private bgTransparent = false;

  private shapeCanvas!: HTMLCanvasElement;
  private iconCanvas!: HTMLCanvasElement;
  private previewCanvas!: HTMLCanvasElement;
  private shapeCtx!: CanvasRenderingContext2D;
  private iconCtx!: CanvasRenderingContext2D;
  private previewCtx!: CanvasRenderingContext2D;

  private savedColors: string[] = [];

  render(): string {
    return `
      <div class="tool-area lb-layout">
        <div class="lb-controls">
          <div class="lb-section">
            <label class="label">Shape</label>
            <div class="lb-shape-picker" id="lb-shape-picker">
              ${SHAPES.map((s, i) => `
                <button class="btn btn--ghost btn--sm lb-shape-btn ${i === 0 ? 'lb-shape-btn--active' : ''}" data-shape="${s.type}" title="${s.type}">
                  ${s.type === 'rect' ? '◻' : s.type === 'circle' ? '○' : '△'}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="lb-section">
            <label class="label">Shape Colors</label>
            <div class="lb-color-row">
              <div class="lb-color-field">
                <span class="lb-color-label">Fill</span>
                <input type="color" id="lb-fill" value="#c9a96e" class="lb-color-input">
              </div>
              <div class="lb-color-field">
                <span class="lb-color-label">Stroke</span>
                <input type="color" id="lb-stroke" value="#1a1a1a" class="lb-color-input">
              </div>
            </div>
            <label class="label" style="margin-top:var(--space-2)">
              <input type="checkbox" id="lb-transparent"> Transparent BG
            </label>
          </div>

          <div class="lb-section">
            <label class="label">Icon / Text</label>
            <div class="lb-source-toggle">
              <button class="btn btn--ghost btn--sm lb-source-btn lb-source-btn--active" data-source="icon">Icon</button>
              <button class="btn btn--ghost btn--sm lb-source-btn" data-source="text">Text</button>
            </div>
            <div id="lb-icon-picker" class="lb-icon-picker">
              ${ICON_KEYS.map(key => `
                <button class="btn btn--ghost btn--sm lb-icon-btn ${key === 'home' ? 'lb-icon-btn--active' : ''}" data-icon="${key}" title="${key}">
                  <span class="lb-icon-preview">${ICONS[key]}</span>
                </button>
              `).join('')}
            </div>
            <div id="lb-text-input" class="lb-text-input" style="display:none;">
              <input type="text" class="input" id="lb-text" value="LOGO" placeholder="Enter text..." maxlength="20">
              <select class="input" id="lb-font">
                ${FONTS.map(f => `<option value="${f}" ${f === 'monospace' ? 'selected' : ''}>${f.split(',')[0]}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="lb-section">
            <label class="label">Icon / Text Color</label>
            <div class="lb-color-row">
              <input type="color" id="lb-icon-color" value="#1a1a1a" class="lb-color-input">
              <span class="lb-color-hex" id="lb-icon-color-hex">#1a1a1a</span>
            </div>
          </div>

          <div class="lb-section">
            <label class="label">Size</label>
            <input type="range" id="lb-size" class="lb-slider" min="20" max="200" value="80">
            <span class="lb-size-val" id="lb-size-val">80px</span>
          </div>

          <div class="lb-section lb-saved-colors" id="lb-saved-colors" style="display:none;">
            <label class="label">Saved Colors</label>
            <div class="lb-saved-swatches" id="lb-saved-swatches"></div>
          </div>

          <div class="tool-actions">
            <button class="btn btn--ghost" id="lb-reset">Reset</button>
            <button class="btn btn--primary" id="lb-download">Download PNG</button>
          </div>
        </div>

        <div class="lb-preview-area">
          <label class="label">Preview</label>
          <div class="lb-canvas-stack">
            <canvas id="lb-shape-canvas" width="${this.canvasSize}" height="${this.canvasSize}" class="lb-canvas"></canvas>
            <canvas id="lb-icon-canvas" width="${this.canvasSize}" height="${this.canvasSize}" class="lb-canvas lb-canvas--overlay"></canvas>
          </div>
          <div class="lb-preview-export">
            <label class="label">Export Preview</label>
            <canvas id="lb-preview-canvas" width="${this.canvasSize}" height="${this.canvasSize}" class="lb-preview-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.shapeCanvas = root.querySelector('#lb-shape-canvas')!;
    this.iconCanvas = root.querySelector('#lb-icon-canvas')!;
    this.previewCanvas = root.querySelector('#lb-preview-canvas')!;
    this.shapeCtx = this.shapeCanvas.getContext('2d')!;
    this.iconCtx = this.iconCanvas.getContext('2d')!;
    this.previewCtx = this.previewCanvas.getContext('2d')!;

    this.loadSavedColors();
    this.drawShape();
    this.drawIcon();
    this.composite();

    // Shape picker
    root.querySelectorAll('.lb-shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.lb-shape-btn').forEach(b => b.classList.remove('lb-shape-btn--active'));
        btn.classList.add('lb-shape-btn--active');
        const type = (btn as HTMLElement).dataset.shape as Shape['type'];
        this.shape = { ...SHAPES.find(s => s.type === type)! };
        (root.querySelector('#lb-fill') as HTMLInputElement).value = this.shape.fill;
        (root.querySelector('#lb-stroke') as HTMLInputElement).value = this.shape.stroke;
        this.drawShape();
        this.composite();
      });
    });

    // Color inputs
    const fillInput = root.querySelector('#lb-fill') as HTMLInputElement;
    const strokeInput = root.querySelector('#lb-stroke') as HTMLInputElement;
    const iconColorInput = root.querySelector('#lb-icon-color') as HTMLInputElement;
    const iconColorHex = root.querySelector('#lb-icon-color-hex') as HTMLSpanElement;

    fillInput.addEventListener('input', () => {
      this.shape.fill = fillInput.value;
      this.drawShape();
      this.composite();
    });

    strokeInput.addEventListener('input', () => {
      this.shape.stroke = strokeInput.value;
      this.drawShape();
      this.composite();
    });

    iconColorInput.addEventListener('input', () => {
      this.iconLayer.color = iconColorInput.value;
      iconColorHex.textContent = iconColorInput.value;
      this.drawIcon();
      this.composite();
    });

    // Transparent BG
    (root.querySelector('#lb-transparent') as HTMLInputElement).addEventListener('change', (e) => {
      this.bgTransparent = (e.target as HTMLInputElement).checked;
      this.drawShape();
      this.composite();
    });

    // Source toggle
    root.querySelectorAll('.lb-source-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.lb-source-btn').forEach(b => b.classList.remove('lb-source-btn--active'));
        btn.classList.add('lb-source-btn--active');
        const source = (btn as HTMLElement).dataset.source as 'icon' | 'text';
        this.iconLayer.source = source;
        (root.querySelector('#lb-icon-picker') as HTMLElement).style.display = source === 'icon' ? '' : 'none';
        (root.querySelector('#lb-text-input') as HTMLElement).style.display = source === 'text' ? '' : 'none';
        this.drawIcon();
        this.composite();
      });
    });

    // Icon picker
    root.querySelectorAll('.lb-icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.lb-icon-btn').forEach(b => b.classList.remove('lb-icon-btn--active'));
        btn.classList.add('lb-icon-btn--active');
        this.iconLayer.iconKey = (btn as HTMLElement).dataset.icon!;
        this.drawIcon();
        this.composite();
      });
    });

    // Text input
    (root.querySelector('#lb-text') as HTMLInputElement).addEventListener('input', (e) => {
      this.iconLayer.text = (e.target as HTMLInputElement).value;
      this.drawIcon();
      this.composite();
    });

    (root.querySelector('#lb-font') as HTMLSelectElement).addEventListener('change', (e) => {
      this.iconLayer.fontFamily = (e.target as HTMLSelectElement).value;
      this.drawIcon();
      this.composite();
    });

    // Size slider
    const sizeSlider = root.querySelector('#lb-size') as HTMLInputElement;
    const sizeVal = root.querySelector('#lb-size-val') as HTMLSpanElement;
    sizeSlider.addEventListener('input', () => {
      this.iconLayer.size = parseInt(sizeSlider.value);
      sizeVal.textContent = `${sizeSlider.value}px`;
      this.drawIcon();
      this.composite();
    });

    // Reset
    root.querySelector('#lb-reset')!.addEventListener('click', () => this.reset(root));

    // Download
    root.querySelector('#lb-download')!.addEventListener('click', () => this.download());
  }

  private loadSavedColors(): void {
    try {
      const stored = localStorage.getItem('ds-saved-colors');
      if (stored) {
        this.savedColors = JSON.parse(stored);
        if (this.savedColors.length > 0) {
          const section = document.getElementById('lb-saved-colors')!;
          section.style.display = '';
          const swatches = document.getElementById('lb-saved-swatches')!;
          swatches.innerHTML = this.savedColors.map(c =>
            `<button class="lb-saved-swatch" data-color="${c}" style="background:${c}" title="${c}"></button>`
          ).join('');
          swatches.querySelectorAll('.lb-saved-swatch').forEach(el => {
            el.addEventListener('click', () => {
              const color = (el as HTMLElement).dataset.color!;
              this.iconLayer.color = color;
              (document.getElementById('lb-icon-color') as HTMLInputElement).value = color;
              (document.getElementById('lb-icon-color-hex') as HTMLSpanElement).textContent = color;
              this.drawIcon();
              this.composite();
            });
          });
        }
      }
    } catch {}
  }

  private drawShape(): void {
    const ctx = this.shapeCtx;
    const s = this.canvasSize;

    ctx.clearRect(0, 0, s, s);

    if (!this.bgTransparent) {
      ctx.fillStyle = this.shape.fill;
    }

    ctx.strokeStyle = this.shape.stroke;
    ctx.lineWidth = this.shape.strokeWidth;
    ctx.lineJoin = 'round';

    const pad = 10;
    const w = s - pad * 2;
    const h = s - pad * 2;

    switch (this.shape.type) {
      case 'rect':
        if (!this.bgTransparent) ctx.fillRect(pad, pad, w, h);
        ctx.strokeRect(pad, pad, w, h);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(s / 2, pad);
        ctx.lineTo(s - pad, s - pad);
        ctx.lineTo(pad, s - pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
    }
  }

  private drawIcon(): void {
    const ctx = this.iconCtx;
    const s = this.canvasSize;

    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = this.iconLayer.color;

    if (this.iconLayer.source === 'text') {
      ctx.font = `${this.iconLayer.size}px ${this.iconLayer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.iconLayer.text, s / 2, s / 2);
    } else {
      const svgStr = ICONS[this.iconLayer.iconKey];
      if (!svgStr) return;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.iconLayer.size}" height="${this.iconLayer.size}" ${svgStr.replace(/^<svg/, '').replace(/fill="currentColor"/g, `fill="${this.iconLayer.color}"`).replace(/stroke="currentColor"/g, `stroke="${this.iconLayer.color}"`)}`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (s - this.iconLayer.size) / 2, (s - this.iconLayer.size) / 2, this.iconLayer.size, this.iconLayer.size);
        URL.revokeObjectURL(url);
        this.composite();
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }
  }

  private composite(): void {
    const ctx = this.previewCtx;
    const s = this.canvasSize;

    ctx.clearRect(0, 0, s, s);
    ctx.drawImage(this.shapeCanvas, 0, 0);
    ctx.drawImage(this.iconCanvas, 0, 0);
  }

  private reset(root: HTMLElement): void {
    this.shape = { ...SHAPES[0] };
    this.iconLayer = {
      source: 'icon',
      iconKey: 'home',
      text: 'LOGO',
      color: '#1a1a1a',
      size: 80,
      fontFamily: 'monospace',
    };
    this.bgTransparent = false;

    (root.querySelector('#lb-fill') as HTMLInputElement).value = '#c9a96e';
    (root.querySelector('#lb-stroke') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color-hex') as HTMLSpanElement).textContent = '#1a1a1a';
    (root.querySelector('#lb-transparent') as HTMLInputElement).checked = false;
    (root.querySelector('#lb-text') as HTMLInputElement).value = 'LOGO';
    (root.querySelector('#lb-font') as HTMLSelectElement).value = 'monospace';
    (root.querySelector('#lb-size') as HTMLInputElement).value = '80';
    (root.querySelector('#lb-size-val') as HTMLSpanElement).textContent = '80px';

    root.querySelectorAll('.lb-shape-btn').forEach((b, i) => b.classList.toggle('lb-shape-btn--active', i === 0));
    root.querySelectorAll('.lb-source-btn').forEach((b, i) => b.classList.toggle('lb-source-btn--active', i === 0));
    root.querySelectorAll('.lb-icon-btn').forEach((b, i) => b.classList.toggle('lb-icon-btn--active', i === 0));
    (root.querySelector('#lb-icon-picker') as HTMLElement).style.display = '';
    (root.querySelector('#lb-text-input') as HTMLElement).style.display = 'none';

    this.drawShape();
    this.drawIcon();
    this.composite();
    Toast.info('Reset to defaults');
  }

  private download(): void {
    this.composite();

    this.previewCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'logo.png';
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('PNG downloaded');
    }, 'image/png');
  }

  destroy(): void {}
}
