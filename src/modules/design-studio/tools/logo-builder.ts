import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import { ICONS } from '../../../core/icons';
import type { Tool } from '../../../types';

type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'shield'
  | 'octagon'
  | 'arrow'
  | 'badge'
  | 'cross'
  | 'heart'
  | 'cloud'
  | 'leaf';

interface Shape {
  type: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface IconLayer {
  source: 'icon' | 'text' | 'upload';
  iconKey: string;
  text: string;
  color: string;
  size: number;
  fontFamily: string;
  uploadedDataUrl: string;
  uploadedImg: HTMLImageElement | null;
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
  { type: 'octagon', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'arrow', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'badge', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'cross', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'heart', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'cloud', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
  { type: 'leaf', fill: '#c9a96e', stroke: '#1a1a1a', strokeWidth: 2 },
];

const SHAPE_ICONS: Record<ShapeType, string> = {
  rect: '◻',
  'rounded-rect': '▢',
  circle: '○',
  triangle: '△',
  diamond: '◇',
  pentagon: '⬠',
  hexagon: '⬡',
  star: '☆',
  shield: '🛡',
  octagon: '⯃',
  arrow: '➤',
  badge: '⬡',
  cross: '✚',
  heart: '♡',
  cloud: '☁',
  leaf: '🍃',
};

const ICON_KEYS = Object.keys(ICONS).filter((k) => !['brandKit', 'brandGuidelines'].includes(k));

const FONT_OPTIONS = [
  'monospace',
  'Georgia, serif',
  'Arial, sans-serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Montserrat, sans-serif',
  'Playfair Display, serif',
  'Poppins, sans-serif',
  'Oswald, sans-serif',
  'Raleway, sans-serif',
  'Lora, serif',
  'DM Serif Display, serif',
  'Bebas Neue, sans-serif',
  'Inter, sans-serif',
  'Space Grotesk, sans-serif',
  'DM Sans, sans-serif',
];

const EXPORT_SIZES = [
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
];

export class LogoBuilder implements Tool {
  id = 'logo-builder';
  name = 'Logo Builder';
  icon = ICONS.logoBuilder;

  private canvasSize = 512;
  private exportSize = 512;
  private shape: Shape = { ...SHAPES[0] };
  private shapeRotation = 0;
  private iconRotation = 0;
  private iconLayer: IconLayer = {
    source: 'icon',
    iconKey: 'logoBuilder',
    text: 'LOGO',
    color: '#1a1a1a',
    size: 120,
    fontFamily: 'monospace',
    uploadedDataUrl: '',
    uploadedImg: null,
  };
  private bgTransparent = false;
  private canvasBgColor = '#1a1a1a';
  private gradientType: 'solid' | 'linear' | 'radial' = 'solid';
  private gradientColor = '#1a1a1a';

  private shapeCanvas!: HTMLCanvasElement;
  private iconCanvas!: HTMLCanvasElement;
  private previewCanvas!: HTMLCanvasElement;
  private shapeCtx!: CanvasRenderingContext2D;
  private iconCtx!: CanvasRenderingContext2D;
  private previewCtx!: CanvasRenderingContext2D;

  render(): string {
    return `
      <div class="tool-area lb-layout">
        <div class="lb-controls">
          <div class="lb-section">
            <label class="label">Shape</label>
            <div class="lb-shape-picker" id="lb-shape-picker">
              ${SHAPES.map(
                (s, i) => `
                <button class="btn btn--ghost btn--sm lb-shape-btn ${i === 0 ? 'lb-shape-btn--active' : ''}" data-shape="${s.type}" title="${s.type}">
                  ${SHAPE_ICONS[s.type]}
                </button>
              `,
              ).join('')}
            </div>
          </div>

          <div class="lb-section">
            <label class="label">Shape Fill</label>
            <div class="lb-fill-toggle">
              <button class="btn btn--ghost btn--sm lb-fill-btn lb-fill-btn--active" data-fill="solid">Solid</button>
              <button class="btn btn--ghost btn--sm lb-fill-btn" data-fill="linear">Linear</button>
              <button class="btn btn--ghost btn--sm lb-fill-btn" data-fill="radial">Radial</button>
            </div>
            <div class="lb-color-row">
              <div class="lb-color-field">
                <span class="lb-color-label">Color 1</span>
                <input type="color" id="lb-fill" value="#c9a96e" class="lb-color-input">
              </div>
              <div class="lb-color-field" id="lb-gradient-field" style="display:none;">
                <span class="lb-color-label">Color 2</span>
                <input type="color" id="lb-gradient" value="#1a1a1a" class="lb-color-input">
              </div>
              <div class="lb-color-field">
                <span class="lb-color-label">Stroke</span>
                <input type="color" id="lb-stroke" value="#1a1a1a" class="lb-color-input">
              </div>
            </div>
            <div class="lb-stroke-width" style="margin-top:var(--space-2);">
              <label class="label">Stroke Width: <span id="lb-stroke-width-val">2</span>px</label>
              <input type="range" id="lb-stroke-width" class="lb-slider" min="0" max="12" value="2">
            </div>
            <label class="label" style="margin-top:var(--space-2)">
              <input type="checkbox" id="lb-transparent"> Transparent BG
            </label>
            <div class="lb-color-row" style="margin-top:var(--space-2);">
              <div class="lb-color-field">
                <span class="lb-color-label">Canvas BG</span>
                <input type="color" id="lb-canvas-bg" value="#1a1a1a" class="lb-color-input">
              </div>
            </div>
          </div>

          <div class="lb-section">
            <label class="label">Shape Rotation: <span id="lb-shape-rot-val">0</span>°</label>
            <input type="range" id="lb-shape-rot" class="lb-slider" min="0" max="360" value="0">
          </div>

          <div class="lb-section">
            <label class="label">Icon / Text / Upload</label>
            <div class="lb-source-toggle">
              <button class="btn btn--ghost btn--sm lb-source-btn lb-source-btn--active" data-source="icon">Icon</button>
              <button class="btn btn--ghost btn--sm lb-source-btn" data-source="text">Text</button>
              <button class="btn btn--ghost btn--sm lb-source-btn" data-source="upload">Upload</button>
            </div>
            <div id="lb-icon-picker" class="lb-icon-picker">
              ${ICON_KEYS.map(
                (key) => `
                <button class="btn btn--ghost btn--sm lb-icon-btn ${key === 'logoBuilder' ? 'lb-icon-btn--active' : ''}" data-icon="${key}" title="${key}">
                  <span class="lb-icon-preview">${ICONS[key]}</span>
                </button>
              `,
              ).join('')}
            </div>
            <div id="lb-text-input" class="lb-text-input" style="display:none;">
              <input type="text" class="input" id="lb-text" value="LOGO" placeholder="Enter text..." maxlength="20">
              <select class="input" id="lb-font">
                ${FONT_OPTIONS.map((f) => `<option value="${f}" ${f === 'monospace' ? 'selected' : ''}>${f.split(',')[0].replace(/'/g, '')}</option>`).join('')}
              </select>
            </div>
            <div id="lb-upload-input" class="lb-upload-input" style="display:none;">
              <input type="file" accept="image/png,image/svg+xml" id="lb-upload-file" hidden>
              <div class="lb-upload-drop" id="lb-upload-drop">
                <span>Click to upload PNG/SVG</span>
              </div>
              <div id="lb-upload-preview" style="display:none;">
                <img id="lb-upload-img" style="max-width:60px;max-height:60px;">
                <button class="btn btn--ghost btn--sm" id="lb-upload-clear">Remove</button>
              </div>
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
            <label class="label">Size: <span id="lb-size-val">120</span>px</label>
            <input type="range" id="lb-size" class="lb-slider" min="20" max="300" value="120">
          </div>

          <div class="lb-section">
            <label class="label">Icon Rotation: <span id="lb-icon-rot-val">0</span>°</label>
            <input type="range" id="lb-icon-rot" class="lb-slider" min="0" max="360" value="0">
          </div>

          <div class="lb-section">
            <label class="label">Export Size</label>
            <div class="lb-export-sizes" id="lb-export-sizes">
              ${EXPORT_SIZES.map(
                (s) => `
                <button class="btn btn--ghost btn--sm lb-size-btn ${s.value === 512 ? 'lb-size-btn--active' : ''}" data-size="${s.value}">${s.label}</button>
              `,
              ).join('')}
            </div>
          </div>

          <div class="tool-actions">
            <button class="btn btn--ghost" id="lb-randomize">Randomize</button>
            <button class="btn btn--ghost" id="lb-reset">Reset</button>
            <button class="btn btn--ghost" id="lb-download-svg">SVG</button>
            <button class="btn btn--ghost" id="lb-download">PNG</button>
            <button class="btn btn--primary" id="lb-send-guidelines">Send to Brand Guidelines</button>
          </div>
        </div>

        <div class="lb-preview-area">
          <label class="label">Preview</label>
          <div class="lb-canvas-stack">
            <canvas id="lb-shape-canvas" width="${this.canvasSize}" height="${this.canvasSize}" class="lb-canvas"></canvas>
            <canvas id="lb-icon-canvas" width="${this.canvasSize}" height="${this.canvasSize}" class="lb-canvas lb-canvas--overlay"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.shapeCanvas = root.querySelector('#lb-shape-canvas')!;
    this.iconCanvas = root.querySelector('#lb-icon-canvas')!;
    this.shapeCtx = this.shapeCanvas.getContext('2d')!;
    this.iconCtx = this.iconCanvas.getContext('2d')!;

    // Off-screen canvas for export
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = this.canvasSize;
    this.previewCanvas.height = this.canvasSize;
    this.previewCtx = this.previewCanvas.getContext('2d')!;

    this.drawShape();
    this.drawIcon();
    this.composite();

    // Shape picker
    root.querySelectorAll('.lb-shape-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.lb-shape-btn')
          .forEach((b) => b.classList.remove('lb-shape-btn--active'));
        btn.classList.add('lb-shape-btn--active');
        const type = (btn as HTMLElement).dataset.shape as ShapeType;
        this.shape = { ...SHAPES.find((s) => s.type === type)! };
        (root.querySelector('#lb-fill') as HTMLInputElement).value = this.shape.fill;
        (root.querySelector('#lb-stroke') as HTMLInputElement).value = this.shape.stroke;
        this.drawShape();
        this.composite();
      });
    });

    // Fill toggle
    root.querySelectorAll('.lb-fill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.lb-fill-btn')
          .forEach((b) => b.classList.remove('lb-fill-btn--active'));
        btn.classList.add('lb-fill-btn--active');
        this.gradientType = (btn as HTMLElement).dataset.fill as 'solid' | 'linear' | 'radial';
        (root.querySelector('#lb-gradient-field') as HTMLElement).style.display =
          this.gradientType === 'solid' ? 'none' : '';
        this.drawShape();
        this.composite();
      });
    });

    // Color inputs
    const fillInput = root.querySelector('#lb-fill') as HTMLInputElement;
    const gradientInput = root.querySelector('#lb-gradient') as HTMLInputElement;
    const strokeInput = root.querySelector('#lb-stroke') as HTMLInputElement;
    const strokeWidthInput = root.querySelector('#lb-stroke-width') as HTMLInputElement;
    const strokeWidthVal = root.querySelector('#lb-stroke-width-val') as HTMLSpanElement;
    const iconColorInput = root.querySelector('#lb-icon-color') as HTMLInputElement;
    const iconColorHex = root.querySelector('#lb-icon-color-hex') as HTMLSpanElement;

    fillInput.addEventListener('input', () => {
      this.shape.fill = fillInput.value;
      this.drawShape();
      this.composite();
    });
    gradientInput.addEventListener('input', () => {
      this.gradientColor = gradientInput.value;
      this.drawShape();
      this.composite();
    });
    strokeInput.addEventListener('input', () => {
      this.shape.stroke = strokeInput.value;
      this.drawShape();
      this.composite();
    });
    strokeWidthInput.addEventListener('input', () => {
      this.shape.strokeWidth = parseInt(strokeWidthInput.value);
      strokeWidthVal.textContent = strokeWidthInput.value;
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

    // Canvas BG color
    const canvasBgInput = root.querySelector('#lb-canvas-bg') as HTMLInputElement;
    canvasBgInput.addEventListener('input', () => {
      this.canvasBgColor = canvasBgInput.value;
      const canvasStack = root.querySelector('.lb-canvas-stack') as HTMLElement;
      canvasStack.style.background = this.canvasBgColor;
      this.composite();
    });

    // Upload file
    const uploadDrop = root.querySelector('#lb-upload-drop')! as HTMLElement;
    const uploadFile = root.querySelector('#lb-upload-file') as HTMLInputElement;
    const uploadPreview = root.querySelector('#lb-upload-preview')! as HTMLElement;
    const uploadImg = root.querySelector('#lb-upload-img') as HTMLImageElement;

    uploadDrop.addEventListener('click', () => uploadFile.click());
    uploadFile.addEventListener('change', () => {
      const file = uploadFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.iconLayer.uploadedDataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          this.iconLayer.uploadedImg = img;
          uploadImg.src = this.iconLayer.uploadedDataUrl;
          uploadPreview.style.display = '';
          uploadDrop.style.display = 'none';
          this.drawIcon();
          this.composite();
        };
        img.src = this.iconLayer.uploadedDataUrl;
      };
      reader.readAsDataURL(file);
    });

    (root.querySelector('#lb-upload-clear') as HTMLElement).addEventListener('click', () => {
      this.iconLayer.uploadedDataUrl = '';
      this.iconLayer.uploadedImg = null;
      uploadPreview.style.display = 'none';
      uploadDrop.style.display = '';
      uploadFile.value = '';
      this.drawIcon();
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
    root.querySelectorAll('.lb-source-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.lb-source-btn')
          .forEach((b) => b.classList.remove('lb-source-btn--active'));
        btn.classList.add('lb-source-btn--active');
        const source = (btn as HTMLElement).dataset.source as 'icon' | 'text' | 'upload';
        this.iconLayer.source = source;
        (root.querySelector('#lb-icon-picker') as HTMLElement).style.display =
          source === 'icon' ? '' : 'none';
        (root.querySelector('#lb-text-input') as HTMLElement).style.display =
          source === 'text' ? '' : 'none';
        (root.querySelector('#lb-upload-input') as HTMLElement).style.display =
          source === 'upload' ? '' : 'none';
        this.drawIcon();
        this.composite();
      });
    });

    // Icon picker
    root.querySelectorAll('.lb-icon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.lb-icon-btn')
          .forEach((b) => b.classList.remove('lb-icon-btn--active'));
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
      sizeVal.textContent = sizeSlider.value;
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
    root.querySelectorAll('.lb-size-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.lb-size-btn')
          .forEach((b) => b.classList.remove('lb-size-btn--active'));
        btn.classList.add('lb-size-btn--active');
        this.exportSize = parseInt((btn as HTMLElement).dataset.size!);
      });
    });

    // Randomize
    root.querySelector('#lb-randomize')!.addEventListener('click', () => this.randomize(root));

    // Reset
    root.querySelector('#lb-reset')!.addEventListener('click', () => this.reset(root));

    // Download PNG
    root.querySelector('#lb-download')!.addEventListener('click', () => this.downloadPng());

    // Download SVG
    root.querySelector('#lb-download-svg')!.addEventListener('click', () => this.downloadSvg());

    // Send to Brand Guidelines
    root
      .querySelector('#lb-send-guidelines')!
      .addEventListener('click', () => this.sendToBrandGuidelines());
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

    // Fill
    if (!this.bgTransparent) {
      if (this.gradientType === 'linear') {
        const grad = ctx.createLinearGradient(0, 0, s, s);
        grad.addColorStop(0, this.shape.fill);
        grad.addColorStop(1, this.gradientColor);
        ctx.fillStyle = grad;
      } else if (this.gradientType === 'radial') {
        const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grad.addColorStop(0, this.shape.fill);
        grad.addColorStop(1, this.gradientColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = this.shape.fill;
      }
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
        if (this.shape.strokeWidth > 0) ctx.strokeRect(pad, pad, w, h);
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
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(s - pad, s - pad);
        ctx.lineTo(pad, s - pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(s - pad, cy);
        ctx.lineTo(cx, s - pad);
        ctx.lineTo(pad, cy);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'pentagon':
        this.drawPolygon(ctx, cx, cy, r, 5);
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'hexagon':
        this.drawPolygon(ctx, cx, cy, r, 6);
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'octagon':
        this.drawPolygon(ctx, cx, cy, r, 8);
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'star':
        this.drawStar(ctx, cx, cy, r, r * 0.45, 5);
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
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
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(cx, pad);
        ctx.lineTo(s - pad, cy);
        ctx.lineTo(cx + w * 0.2, cy);
        ctx.lineTo(cx + w * 0.2, s - pad);
        ctx.lineTo(cx - w * 0.2, s - pad);
        ctx.lineTo(cx - w * 0.2, cy);
        ctx.lineTo(pad, cy);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      case 'badge': {
        const points = 12;
        const outerR = r;
        const innerR = r * 0.8;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const rr = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const x = cx + rr * Math.cos(angle);
          const y = cy + rr * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      }
      case 'cross': {
        const t = w * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx - t, pad);
        ctx.lineTo(cx + t, pad);
        ctx.lineTo(cx + t, cy - t);
        ctx.lineTo(s - pad, cy - t);
        ctx.lineTo(s - pad, cy + t);
        ctx.lineTo(cx + t, cy + t);
        ctx.lineTo(cx + t, s - pad);
        ctx.lineTo(cx - t, s - pad);
        ctx.lineTo(cx - t, cy + t);
        ctx.lineTo(pad, cy + t);
        ctx.lineTo(pad, cy - t);
        ctx.lineTo(cx - t, cy - t);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      }
      case 'heart': {
        const topY = cy - r * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, s - pad);
        ctx.bezierCurveTo(cx - r * 1.5, cy, cx - r * 0.5, topY - r * 0.5, cx, topY + r * 0.2);
        ctx.bezierCurveTo(cx + r * 0.5, topY - r * 0.5, cx + r * 1.5, cy, cx, s - pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      }
      case 'cloud': {
        const cloudY = cy + 10;
        ctx.beginPath();
        ctx.arc(cx - r * 0.35, cloudY, r * 0.4, Math.PI, 0);
        ctx.arc(cx, cloudY - r * 0.3, r * 0.5, Math.PI * 1.1, Math.PI * -0.1);
        ctx.arc(cx + r * 0.4, cloudY, r * 0.35, Math.PI * 1.1, 0);
        ctx.lineTo(cx + r * 0.75, cloudY + r * 0.3);
        ctx.lineTo(cx - r * 0.75, cloudY + r * 0.3);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        break;
      }
      case 'leaf': {
        ctx.beginPath();
        ctx.moveTo(pad, s - pad);
        ctx.quadraticCurveTo(pad, pad, s - pad, pad);
        ctx.quadraticCurveTo(s - pad, s - pad, pad, s - pad);
        ctx.closePath();
        if (!this.bgTransparent) ctx.fill();
        if (this.shape.strokeWidth > 0) ctx.stroke();
        // Vein
        ctx.strokeStyle = this.shape.stroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad + 15, s - pad - 15);
        ctx.lineTo(s - pad - 15, pad + 15);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    sides: number,
  ): void {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    points: number,
  ): void {
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
    } else if (this.iconLayer.source === 'upload' && this.iconLayer.uploadedImg) {
      const img = this.iconLayer.uploadedImg;
      const scale = Math.min(this.iconLayer.size / img.width, this.iconLayer.size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      ctx.restore();
    } else {
      const svgStr = ICONS[this.iconLayer.iconKey];
      if (!svgStr) {
        ctx.restore();
        return;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.iconLayer.size}" height="${this.iconLayer.size}" ${svgStr
        .replace(/^<svg/, '')
        .replace(/fill="currentColor"/g, `fill="${this.iconLayer.color}"`)
        .replace(/stroke="currentColor"/g, `stroke="${this.iconLayer.color}"`)}`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(
          img,
          (s - this.iconLayer.size) / 2,
          (s - this.iconLayer.size) / 2,
          this.iconLayer.size,
          this.iconLayer.size,
        );
        URL.revokeObjectURL(url);
        ctx.restore();
        this.composite();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        ctx.restore();
      };
      img.src = url;
    }
  }

  private composite(): void {
    const ctx = this.previewCtx;
    const s = this.canvasSize;

    ctx.clearRect(0, 0, s, s);
    if (!this.bgTransparent) {
      ctx.fillStyle = this.canvasBgColor;
      ctx.fillRect(0, 0, s, s);
    }
    ctx.drawImage(this.shapeCanvas, 0, 0);
    ctx.drawImage(this.iconCanvas, 0, 0);
  }

  private randomize(root: HTMLElement): void {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const h = Math.floor(Math.random() * 360);
    const fill = `hsl(${h}, ${40 + Math.floor(Math.random() * 40)}%, ${40 + Math.floor(Math.random() * 20)}%)`;
    const stroke = `hsl(${h}, 10%, ${10 + Math.floor(Math.random() * 15)}%)`;
    const iconColor = `hsl(${(h + 180) % 360}, ${30 + Math.floor(Math.random() * 40)}%, ${30 + Math.floor(Math.random() * 30)}%)`;

    this.shape = { ...randomShape, fill, stroke, strokeWidth: 2 + Math.floor(Math.random() * 4) };
    this.shapeRotation = [0, 0, 0, 45, 90, 180][Math.floor(Math.random() * 6)];
    this.iconLayer.source = 'icon';
    this.iconLayer.iconKey = ICON_KEYS[Math.floor(Math.random() * ICON_KEYS.length)];
    this.iconLayer.color = iconColor;
    this.iconLayer.size = 80 + Math.floor(Math.random() * 100);
    this.gradientType = ['solid', 'solid', 'linear', 'radial'][Math.floor(Math.random() * 4)] as
      | 'solid'
      | 'linear'
      | 'radial';
    this.gradientColor = `hsl(${(h + 40) % 360}, 20%, 20%)`;
    this.canvasBgColor = `hsl(${h}, 8%, ${10 + Math.floor(Math.random() * 15)}%)`;

    // Update UI
    (root.querySelector('#lb-fill') as HTMLInputElement).value = this.shape.fill;
    (root.querySelector('#lb-stroke') as HTMLInputElement).value = this.shape.stroke;
    (root.querySelector('#lb-gradient') as HTMLInputElement).value = this.gradientColor;
    (root.querySelector('#lb-icon-color') as HTMLInputElement).value = this.iconLayer.color;
    (root.querySelector('#lb-icon-color-hex') as HTMLSpanElement).textContent =
      this.iconLayer.color;
    (root.querySelector('#lb-stroke-width') as HTMLInputElement).value = String(
      this.shape.strokeWidth,
    );
    (root.querySelector('#lb-stroke-width-val') as HTMLSpanElement).textContent = String(
      this.shape.strokeWidth,
    );
    (root.querySelector('#lb-shape-rot') as HTMLInputElement).value = String(this.shapeRotation);
    (root.querySelector('#lb-shape-rot-val') as HTMLSpanElement).textContent = String(
      this.shapeRotation,
    );
    (root.querySelector('#lb-size') as HTMLInputElement).value = String(this.iconLayer.size);
    (root.querySelector('#lb-size-val') as HTMLSpanElement).textContent = String(
      this.iconLayer.size,
    );
    (root.querySelector('#lb-gradient-field') as HTMLElement).style.display =
      this.gradientType === 'solid' ? 'none' : '';
    (root.querySelector('#lb-canvas-bg') as HTMLInputElement).value = this.canvasBgColor;
    const canvasStack = root.querySelector('.lb-canvas-stack') as HTMLElement;
    canvasStack.style.background = this.canvasBgColor;

    root
      .querySelectorAll('.lb-shape-btn')
      .forEach((b) =>
        b.classList.toggle(
          'lb-shape-btn--active',
          (b as HTMLElement).dataset.shape === this.shape.type,
        ),
      );
    root
      .querySelectorAll('.lb-icon-btn')
      .forEach((b) =>
        b.classList.toggle(
          'lb-icon-btn--active',
          (b as HTMLElement).dataset.icon === this.iconLayer.iconKey,
        ),
      );
    root
      .querySelectorAll('.lb-fill-btn')
      .forEach((b) =>
        b.classList.toggle(
          'lb-fill-btn--active',
          (b as HTMLElement).dataset.fill === this.gradientType,
        ),
      );
    root
      .querySelectorAll('.lb-source-btn')
      .forEach((b) =>
        b.classList.toggle('lb-source-btn--active', (b as HTMLElement).dataset.source === 'icon'),
      );
    (root.querySelector('#lb-icon-picker') as HTMLElement).style.display = '';
    (root.querySelector('#lb-text-input') as HTMLElement).style.display = 'none';
    (root.querySelector('#lb-upload-input') as HTMLElement).style.display = 'none';

    this.drawShape();
    this.drawIcon();
    this.composite();
    Toast.info('Random logo generated');
    logToolAction('logo-builder', 'Randomized logo');
  }

  private reset(root: HTMLElement): void {
    this.shape = { ...SHAPES[0] };
    this.shapeRotation = 0;
    this.iconRotation = 0;
    this.gradientType = 'solid';
    this.gradientColor = '#1a1a1a';
    this.iconLayer = {
      source: 'icon',
      iconKey: 'logoBuilder',
      text: 'LOGO',
      color: '#1a1a1a',
      size: 120,
      fontFamily: 'monospace',
      uploadedDataUrl: '',
      uploadedImg: null,
    };
    this.bgTransparent = false;
    this.canvasBgColor = '#1a1a1a';
    this.exportSize = 512;

    (root.querySelector('#lb-fill') as HTMLInputElement).value = '#c9a96e';
    (root.querySelector('#lb-stroke') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-gradient') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-icon-color-hex') as HTMLSpanElement).textContent = '#1a1a1a';
    (root.querySelector('#lb-transparent') as HTMLInputElement).checked = false;
    (root.querySelector('#lb-text') as HTMLInputElement).value = 'LOGO';
    (root.querySelector('#lb-font') as HTMLSelectElement).value = 'monospace';
    (root.querySelector('#lb-size') as HTMLInputElement).value = '120';
    (root.querySelector('#lb-size-val') as HTMLSpanElement).textContent = '120px';
    (root.querySelector('#lb-shape-rot') as HTMLInputElement).value = '0';
    (root.querySelector('#lb-shape-rot-val') as HTMLSpanElement).textContent = '0';
    (root.querySelector('#lb-icon-rot') as HTMLInputElement).value = '0';
    (root.querySelector('#lb-icon-rot-val') as HTMLSpanElement).textContent = '0';
    (root.querySelector('#lb-stroke-width') as HTMLInputElement).value = '2';
    (root.querySelector('#lb-stroke-width-val') as HTMLSpanElement).textContent = '2';
    (root.querySelector('#lb-gradient-field') as HTMLElement).style.display = 'none';
    (root.querySelector('#lb-canvas-bg') as HTMLInputElement).value = '#1a1a1a';
    (root.querySelector('#lb-upload-preview') as HTMLElement).style.display = 'none';
    (root.querySelector('#lb-upload-drop') as HTMLElement).style.display = '';
    (root.querySelector('#lb-upload-file') as HTMLInputElement).value = '';
    const canvasStack = root.querySelector('.lb-canvas-stack') as HTMLElement;
    canvasStack.style.background = '#1a1a1a';

    root
      .querySelectorAll('.lb-shape-btn')
      .forEach((b, i) => b.classList.toggle('lb-shape-btn--active', i === 0));
    root
      .querySelectorAll('.lb-source-btn')
      .forEach((b, i) => b.classList.toggle('lb-source-btn--active', i === 0));
    root
      .querySelectorAll('.lb-icon-btn')
      .forEach((b) =>
        b.classList.toggle(
          'lb-icon-btn--active',
          (b as HTMLElement).dataset.icon === 'logoBuilder',
        ),
      );
    root
      .querySelectorAll('.lb-size-btn')
      .forEach((b) =>
        b.classList.toggle('lb-size-btn--active', (b as HTMLElement).dataset.size === '512'),
      );
    root
      .querySelectorAll('.lb-fill-btn')
      .forEach((b, i) => b.classList.toggle('lb-fill-btn--active', i === 0));
    (root.querySelector('#lb-icon-picker') as HTMLElement).style.display = '';
    (root.querySelector('#lb-text-input') as HTMLElement).style.display = 'none';
    (root.querySelector('#lb-upload-input') as HTMLElement).style.display = 'none';

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
      a.download = `[Inztun] logo-${this.exportSize}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(`${this.exportSize}px PNG downloaded`);
      logToolAction('logo-builder', `Downloaded logo PNG ${this.exportSize}px`);
    }, 'image/png');
  }

  private downloadSvg(): void {
    const s = this.exportSize;
    const pad = 10 * (s / 512);
    const w = s - pad * 2;
    const h = s - pad * 2;
    const cx = s / 2;
    const cy = s / 2;
    const r = Math.min(w, h) / 2;

    const shapeTransform = this.shapeRotation
      ? `transform="rotate(${this.shapeRotation} ${cx} ${cy})"`
      : '';
    const iconTransform = this.iconRotation
      ? `transform="rotate(${this.iconRotation} ${cx} ${cy})"`
      : '';

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
      case 'hexagon':
      case 'octagon': {
        const sides = this.shape.type === 'pentagon' ? 5 : this.shape.type === 'hexagon' ? 6 : 8;
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
      case 'arrow':
        shapeSvg = `<polygon points="${cx},${pad} ${s - pad},${cy} ${cx + w * 0.2},${cy} ${cx + w * 0.2},${s - pad} ${cx - w * 0.2},${s - pad} ${cx - w * 0.2},${cy} ${pad},${cy}" ${shapeTransform}/>`;
        break;
      case 'badge': {
        const bPts = 12;
        const bOuterR = r;
        const bInnerR = r * 0.8;
        const bPtsArr = [];
        for (let i = 0; i < bPts * 2; i++) {
          const rr = i % 2 === 0 ? bOuterR : bInnerR;
          const angle = (i * Math.PI) / bPts - Math.PI / 2;
          bPtsArr.push(`${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`);
        }
        shapeSvg = `<polygon points="${bPtsArr.join(' ')}" ${shapeTransform}/>`;
        break;
      }
      case 'cross': {
        const t = w * 0.25;
        shapeSvg = `<polygon points="${cx - t},${pad} ${cx + t},${pad} ${cx + t},${cy - t} ${s - pad},${cy - t} ${s - pad},${cy + t} ${cx + t},${cy + t} ${cx + t},${s - pad} ${cx - t},${s - pad} ${cx - t},${cy + t} ${pad},${cy + t} ${pad},${cy - t} ${cx - t},${cy - t}" ${shapeTransform}/>`;
        break;
      }
      case 'heart': {
        const topY = cy - r * 0.3;
        shapeSvg = `<path d="M${cx},${s - pad} C${cx - r * 1.5},${cy} ${cx - r * 0.5},${topY - r * 0.5} ${cx},${topY + r * 0.2} C${cx + r * 0.5},${topY - r * 0.5} ${cx + r * 1.5},${cy} ${cx},${s - pad} Z" ${shapeTransform}/>`;
        break;
      }
      case 'cloud': {
        const cloudY = cy + 10;
        shapeSvg = `<path d="M${cx - r * 0.75},${cloudY + r * 0.3} L${cx + r * 0.75},${cloudY + r * 0.3} L${cx + r * 0.75},${cloudY} A${r * 0.35},${r * 0.35} 0 0,1 ${cx + r * 0.4},${cloudY - r * 0.35} A${r * 0.5},${r * 0.5} 0 0,1 ${cx - r * 0.35},${cloudY - r * 0.3} A${r * 0.4},${r * 0.4} 0 0,1 ${cx - r * 0.75},${cloudY} Z" ${shapeTransform}/>`;
        break;
      }
      case 'leaf':
        shapeSvg = `<path d="M${pad},${s - pad} Q${pad},${pad} ${s - pad},${pad} Q${s - pad},${s - pad} ${pad},${s - pad} Z" ${shapeTransform}/>`;
        break;
      default:
        shapeSvg = `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" ${shapeTransform}/>`;
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
        iconSvg = `<g transform="translate(${ix},${iy})" ${iconTransform}>${rawIcon
          .replace(/^<svg[^>]*>/, '')
          .replace(/<\/svg>/, '')
          .replace(/fill="currentColor"/g, `fill="${this.iconLayer.color}"`)
          .replace(/stroke="currentColor"/g, `stroke="${this.iconLayer.color}"`)
          .replace(/width="\d+"/, `width="${iconSize}"`)
          .replace(/height="\d+"/, `height="${iconSize}"`)}</g>`;
      }
    }

    const bgRect = this.bgTransparent
      ? ''
      : `<rect width="${s}" height="${s}" fill="${this.canvasBgColor}"/>`;
    const shapeStroke =
      this.shape.strokeWidth > 0
        ? `stroke="${this.shape.stroke}" stroke-width="${this.shape.strokeWidth}"`
        : 'stroke="none"';
    const shapeFill = this.bgTransparent ? 'fill="none"' : `fill="${this.shape.fill}"`;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${bgRect}<g ${shapeFill} ${shapeStroke}>${shapeSvg}</g>${iconSvg}</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `[Inztun] logo-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('SVG downloaded');
    logToolAction('logo-builder', 'Downloaded logo SVG');
  }

  private sendToBrandGuidelines(): void {
    this.composite();
    const dataUrl = this.previewCanvas.toDataURL('image/png');
    try {
      localStorage.setItem('lb-logo-transfer', dataUrl);
      window.location.hash = '#/design-studio/brand-guidelines';
      Toast.info('Logo sent to Brand Guidelines');
      logToolAction('logo-builder', 'Sent logo to Brand Guidelines');
    } catch {
      Toast.error('Could not transfer logo');
    }
  }

  destroy(): void {}
}
