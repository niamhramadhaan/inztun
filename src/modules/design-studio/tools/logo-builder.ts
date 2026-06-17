import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { ICONS } from '../../../core/icons';
import { db } from '../../../core/db';
import type { Tool } from '../../../types';

type ShapeType = 'rect' | 'circle' | 'triangle' | 'pentagon' | 'hexagon' | 'diamond' | 'star' | 'rounded-rect' | 'shield';

interface Shape {
  type: ShapeType;
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
  { type: 'rounded-rect', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'circle', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'triangle', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'diamond', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'pentagon', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'hexagon', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'star', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'shield', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
];

const SHAPE_ICONS: Record<ShapeType, string> = {
  'rect': '◻',
  'rounded-rect': '▢',
  'circle': '○',
  'triangle': '△',
  'diamond': '◇',
  'pentagon': '⬠',
  'hexagon': '⬡',
  'star': '☆',
  'shield': '🛡',
};

const ICON_KEYS = ['home', 'workers', 'design', 'marketing', 'freelance', 'json', 'hash', 'uuid', 'password', 'gradient', 'palette', 'invoice', 'clients', 'search', 'settings'];

const FONTS = [
  'monospace',
  'Georgia, serif',
  'Arial, sans-serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Impact, sans-serif',
  "'Trebuchet MS', sans-serif",
  "'Palatino Linotype', serif",
  "'Lucida Console', monospace",
  "'Comic Sans MS', cursive",
];

const EXPORT_SIZES = [
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
];

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
  private exportSize = 256;
  private shape: Shape = { ...SHAPES[0] };
  private shapeRotation = 0;
  private iconRotation = 0;
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
                  ${SHAPE_ICONS[s.type]}
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
            <label class="label">Shape Rotation: <span id="lb-shape-rot-val">0</span>°</label>
            <input type="range" id="lb-shape-rot" class="lb-slider" min="0" max="360" value="0">
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
                ${FONTS.map(f => `<option value="${f}" ${f === 'monospace' ? 'selected' : ''}>${f.split(',')[0].replace(/'/g, '')}</option>`).join('')}
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

          <div class="lb-section">
            <label class="label">Icon Rotation: <span id="lb-icon-rot-val">0</span>°</label>
            <input type="range" id="lb-icon-rot" class="lb-slider" min="0" max="360" value="0">
          </div>

          <div class="lb-section lb-saved-colors" id="lb-saved-colors" style="display:none;">
            <label class="label">Saved Colors</label>
            <div class="lb-saved-swatches" id="lb-saved-swatches"></div>
          </div>

          <div class="lb-section">
            <label class="label">Export Size</label>
            <div class="lb-export-sizes" id="lb-export-sizes">
              ${EXPORT_SIZES.map(s => `
                <button class="btn btn--ghost btn--sm lb-size-btn ${s.value === 256 ? 'lb-size-btn--active' : ''}" data-size="${s.value}">${s.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="tool-actions">
            <button class="btn btn--ghost" id="lb-reset">Reset</button>
            <button class="btn btn--ghost" id="lb-download-svg">Download SVG</button>
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
        const type = (btn as HTMLElement).dataset.shape as ShapeType;
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

    // Shape rotation
    const shapeRotSlider = root.querySelector('#lb-shape-rot') as HTMLInputElement;
    const shapeRotVal = root.querySelector('#lb-shape-rot-val') as HTMLSpanElement;
    shapeRotSlider.addEventListener('input', () => {
      this.shapeRotation = parseInt(shapeRotSlider.value);
      shapeRotVal.textContent = shapeRotSlider.value;
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

    // Icon rotation
    const iconRotSlider = root.querySelector('#lb-icon-rot') as HTMLInputElement;
    const iconRotVal = root.querySelector('#lb-icon-rot-val') as HTMLSpanElement;
    iconRotSlider.addEventListener('input', () => {
      this.iconRotation = parseInt(iconRotSlider.value);
      iconRotVal.textContent = iconRotSlider.value;
      this.drawIcon();
      this.composite();
    });

    // Export size
    root.querySelectorAll('.lb-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.lb-size-btn').forEach(b => b.classList.remove('lb-size-btn--active'));
        btn.classList.add('lb-size-btn--active');
        this.exportSize = parseInt((btn as HTMLElement).dataset.size!);
      });
    });

    // Reset
    root.querySelector('#lb-reset')!.addEventListener('click', () => this.reset(root));

    // Download PNG
    root.querySelector('#lb-download')!.addEventListener('click', () => this.downloadPng());

    // Download SVG
    root.querySelector('#lb-download-svg')!.addEventListener('click', () => this.downloadSvg());

    // Load default export size
    db.getPreference('defaultExportSize', 256).then(val => {
      this.exportSize = val as number;
      root.querySelectorAll('.lb-size-btn').forEach(b => {
        b.classList.toggle('lb-size-btn--active', parseInt((b as HTMLElement).dataset.size!) === this.exportSize);
      });
    });
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
    ctx.save();

    if (this.shapeRotation) {
      ctx.translate(s / 2, s / 2);
      ctx.rotate((this.shapeRotation * Math.PI) / 180);
      ctx.translate(-s / 2, -s / 2);
    }

    if (!this.bgTransparent) {
      ctx.fillStyle = this.shape.fill;
    }
    ctx.strokeStyle = this.shape.stroke;
    ctx.lineWidth = this.shape.strokeWidth;
    ctx.lineJoin = 'round';

    const pad = 10;
    const w = s - pad * 2;
    const h = s - pad * 2;
    const cx = s / 2;
    const cy = s / 2;
    const r = Math.min(w, h) / 2;

    switch (this.shape.type) {
      case 'rect':
        if (!this.bgTransparent) ctx.fillRect(pad, pad, w, h);
        ctx.strokeRect(pad, pad, w, h);
        break;
      case 'rounded-rect': {
        const rr = 20;
        ctx.beginPath();
        ctx.moveTo(pad + rr, pad);
        ctx.lineTo(pad + w - rr, pad);
        ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + rr);
        ctx.lineTo(pad + w, pad + h - rr);
        ctx.quadraticCurveTo(pad + w, pad + h, pad + w - rr, pad + h);
        ctx.lineTo(pad + rr, pad + h);
        ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - rr);
        ctx.lineTo(pad, pad + rr);
        ctx.quadraticCurveTo(pad, pad, pad + rr, pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(s - pad, s - pad);
        ctx.lineTo(pad, s - pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(s - pad, cy);
        ctx.lineTo(cx, s - pad);
        ctx.lineTo(pad, cy);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
      case 'pentagon':
        this.drawPolygon(ctx, cx, cy, r, 5, pad);
        break;
      case 'hexagon':
        this.drawPolygon(ctx, cx, cy, r, 6, pad);
        break;
      case 'star':
        this.drawStar(ctx, cx, cy, r, r * 0.45, 5);
        break;
      case 'shield':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(pad + w, pad);
        ctx.lineTo(pad + w, cy + 20);
        ctx.quadraticCurveTo(pad + w, s - pad - 10, cx, s - pad);
        ctx.quadraticCurveTo(pad, s - pad - 10, pad, cy + 20);
        ctx.lineTo(pad, pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, _pad: number): void {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (!this.bgTransparent) ctx.fill();
    ctx.stroke();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (!this.bgTransparent) ctx.fill();
    ctx.stroke();
  }

  private drawIcon(): void {
    const ctx = this.iconCtx;
    const s = this.canvasSize;

    ctx.clearRect(0, 0, s, s);
    ctx.save();

    if (this.iconRotation) {
      ctx.translate(s / 2, s / 2);
      ctx.rotate((this.iconRotation * Math.PI) / 180);
      ctx.translate(-s / 2, -s / 2);
    }

    ctx.fillStyle = this.iconLayer.color;

    if (this.iconLayer.source === 'text') {
      ctx.font = `${this.iconLayer.size}px ${this.iconLayer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.iconLayer.text, s / 2, s / 2);
      ctx.restore();
    } else {
      const svgStr = ICONS[this.iconLayer.iconKey];
      if (!svgStr) { ctx.restore(); return; }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.iconLayer.size}" height="${this.iconLayer.size}" ${svgStr.replace(/^<svg/, '').replace(/fill="currentColor"/g, `fill="${this.iconLayer.color}"`).replace(/stroke="currentColor"/g, `stroke="${this.iconLayer.color}"`)}`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (s - this.iconLayer.size) / 2, (s - this.iconLayer.size) / 2, this.iconLayer.size, this.iconLayer.size);
        URL.revokeObjectURL(url);
        ctx.restore();
        this.composite();
      };
      img.onerror = () => { URL.revokeObjectURL(url); ctx.restore(); };
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
    this.shapeRotation = 0;
    this.iconRotation = 0;
    this.iconLayer = {
      source: 'icon',
      iconKey: 'home',
      text: 'LOGO',
      color: '#1a1a1a',
      size: 80,
      fontFamily: 'monospace',
    };
    this.bgTransparent = false;
    this.exportSize = 256;

    (root.querySelector('#lb-fill') as HTMLInputElement).value = '#c9a96e';
    (root.querySelector('#lb-stroke') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color-hex') as HTMLSpanElement).textContent = '#1a1a1a';
    (root.querySelector('#lb-transparent') as HTMLInputElement).checked = false;
    (root.querySelector('#lb-text') as HTMLInputElement).value = 'LOGO';
    (root.querySelector('#lb-font') as HTMLSelectElement).value = 'monospace';
    (root.querySelector('#lb-size') as HTMLInputElement).value = '80';
    (root.querySelector('#lb-size-val') as HTMLSpanElement).textContent = '80px';
    (root.querySelector('#lb-shape-rot') as HTMLInputElement).value = '0';
    (root.querySelector('#lb-shape-rot-val') as HTMLSpanElement).textContent = '0';
    (root.querySelector('#lb-icon-rot') as HTMLInputElement).value = '0';
    (root.querySelector('#lb-icon-rot-val') as HTMLSpanElement).textContent = '0';

    root.querySelectorAll('.lb-shape-btn').forEach((b, i) => b.classList.toggle('lb-shape-btn--active', i === 0));
    root.querySelectorAll('.lb-source-btn').forEach((b, i) => b.classList.toggle('lb-source-btn--active', i === 0));
    root.querySelectorAll('.lb-icon-btn').forEach((b, i) => b.classList.toggle('lb-icon-btn--active', i === 0));
    root.querySelectorAll('.lb-size-btn').forEach((b, i) => b.classList.toggle('lb-size-btn--active', i === 0));
    (root.querySelector('#lb-icon-picker') as HTMLElement).style.display = '';
    (root.querySelector('#lb-text-input') as HTMLElement).style.display = 'none';

    this.drawShape();
    this.drawIcon();
    this.composite();
    Toast.info('Reset to defaults');
  }

  private downloadPng(): void {
    this.composite();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.exportSize;
    exportCanvas.height = this.exportSize;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.drawImage(this.previewCanvas, 0, 0, this.exportSize, this.exportSize);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logo-${this.exportSize}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(`${this.exportSize}px PNG downloaded`);
      logToolAction('logo-builder', `Downloaded logo PNG ${this.exportSize}px`);
    }, 'image/png');
  }

  private downloadSvg(): void {
    const s = this.exportSize;
    const pad = 10 * (s / 256);
    const w = s - pad * 2;
    const h = s - pad * 2;
    const cx = s / 2;
    const cy = s / 2;
    const r = Math.min(w, h) / 2;

    const shapeTransform = this.shapeRotation ? `transform="rotate(${this.shapeRotation} ${cx} ${cy})"` : '';
    const iconTransform = this.iconRotation ? `transform="rotate(${this.iconRotation} ${cx} ${cy})"` : '';

    let shapeSvg = '';
    switch (this.shape.type) {
      case 'rect':
        shapeSvg = `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" ${shapeTransform}/>`;
        break;
      case 'rounded-rect':
        shapeSvg = `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="20" ${shapeTransform}/>`;
        break;
      case 'circle':
        shapeSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" ${shapeTransform}/>`;
        break;
      case 'triangle':
        shapeSvg = `<polygon points="${cx},${pad} ${s - pad},${s - pad} ${pad},${s - pad}" ${shapeTransform}/>`;
        break;
      case 'diamond':
        shapeSvg = `<polygon points="${cx},${pad} ${s - pad},${cy} ${cx},${s - pad} ${pad},${cy}" ${shapeTransform}/>`;
        break;
      case 'pentagon':
      case 'hexagon': {
        const sides = this.shape.type === 'pentagon' ? 5 : 6;
        const pts = [];
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        shapeSvg = `<polygon points="${pts.join(' ')}" ${shapeTransform}/>`;
        break;
      }
      case 'star': {
        const pts = [];
        const innerR = r * 0.45;
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 === 0 ? r : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          pts.push(`${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`);
        }
        shapeSvg = `<polygon points="${pts.join(' ')}" ${shapeTransform}/>`;
        break;
      }
      case 'shield':
        shapeSvg = `<path d="M${cx},${pad} L${s - pad},${pad} L${s - pad},${cy + 20} Q${s - pad},${s - pad - 10} ${cx},${s - pad} Q${pad},${s - pad - 10} ${pad},${cy + 20} Z" ${shapeTransform}/>`;
        break;
    }

    let iconSvg = '';
    if (this.iconLayer.source === 'text') {
      iconSvg = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${this.iconLayer.size}" font-family="${this.iconLayer.fontFamily}" fill="${this.iconLayer.color}" ${iconTransform}>${this.iconLayer.text}</text>`;
    } else {
      const rawIcon = ICONS[this.iconLayer.iconKey];
      if (rawIcon) {
        const iconSize = this.iconLayer.size;
        const ix = (s - iconSize) / 2;
        const iy = (s - iconSize) / 2;
        iconSvg = `<g transform="translate(${ix},${iy})" ${iconTransform}>${rawIcon.replace(/^<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/fill="currentColor"/g, `fill="${this.iconLayer.color}"`).replace(/stroke="currentColor"/g, `stroke="${this.iconLayer.color}"`).replace(/width="\d+"/, `width="${iconSize}"`).replace(/height="\d+"/, `height="${iconSize}"`)}</g>`;
      }
    }

    const bgRect = this.bgTransparent ? '' : `<rect width="${s}" height="${s}" fill="${this.shape.fill}"/>`;
    const shapeStroke = `stroke="${this.shape.stroke}" stroke-width="${this.shape.strokeWidth}"`;
    const shapeFill = this.bgTransparent ? 'fill="none"' : `fill="${this.shape.fill}"`;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${bgRect}<g ${shapeFill} ${shapeStroke}>${shapeSvg}</g>${iconSvg}</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logo.svg';
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('SVG downloaded');
    logToolAction('logo-builder', 'Downloaded logo SVG');
  }

  destroy(): void {}
}
