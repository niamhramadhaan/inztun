import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import {
  bindClipboardPaste,
  canvasToBlob,
  createDropZone,
  downloadBlob,
  getExtFromMime,
  loadImage,
} from '../../../utils/image';

type Handle = null | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | 'move';

const RATIOS: Array<{ label: string; value: number | null }> = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '9:16', value: 9 / 16 },
];

export class ImageCrop {
  id = 'image-crop';
  name = 'Image Cropper';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M6 2v4H2"/><path d="M18 22v-4h4"/>
      <path d="M6 6h12a2 2 0 0 1 2 2v12"/><path d="M18 18H6a2 2 0 0 1-2-2V4"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private controlsEl!: HTMLDivElement;
  private canvasEl!: HTMLCanvasElement;
  private dimEl!: HTMLSpanElement;
  private actionsEl!: HTMLDivElement;
  private formatSelect!: HTMLSelectElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;
  private ratioButtons!: HTMLDivElement;

  private image: HTMLImageElement | null = null;
  private displayScale = 1;
  // Crop in image-space coordinates
  private cx = 0;
  private cy = 0;
  private cw = 0;
  private ch = 0;
  private activeHandle: Handle = null;
  private startX = 0;
  private startY = 0;
  private startCx = 0;
  private startCy = 0;
  private startCw = 0;
  private startCh = 0;
  private lockedRatio: number | null = null;
  private cleanupPaste!: () => void;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imcr-dropzone"></div>
        <div class="imcr-controls" id="imcr-controls" style="display:none;">
          <div class="form-group">
            <label class="label">Aspect Ratio</label>
            <div class="imcr-ratio-btns" id="imcr-ratios">
              ${RATIOS.map((r, i) => `<button class="btn btn--ghost btn--sm imcr-ratio-btn ${i === 0 ? 'imcr-ratio-btn--active' : ''}" data-ratio="${r.value ?? ''}">${r.label}</button>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="label">Output Format</label>
            <select class="input" id="imcr-format" style="width:auto;">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div class="form-group" id="imcr-quality-group">
            <label class="label">Quality: <span id="imcr-quality-val">90</span>%</label>
            <input type="range" id="imcr-quality" min="1" max="100" value="90" class="password-slider">
          </div>
        </div>
        <div class="imcr-canvas-wrap" id="imcr-canvas-wrap" style="display:none;">
          <canvas id="imcr-canvas" class="imcr-canvas"></canvas>
          <div class="imcr-dims" id="imcr-dims">—</div>
        </div>
        <div class="tool-actions" id="imcr-actions" style="display:none;">
          <button class="btn btn--primary" id="imcr-download">Crop & Download</button>
          <button class="btn btn--ghost" id="imcr-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = createDropZone({
      id: 'imcr-dropzone',
      hint: 'Supports PNG, JPEG, WebP',
      onFile: (file) => this.handleFile(file),
    });
    root.querySelector('#imcr-dropzone')!.replaceWith(this.dropZone);

    this.controlsEl = root.querySelector('#imcr-controls')!;
    this.canvasEl = root.querySelector('#imcr-canvas')!;
    this.dimEl = root.querySelector('#imcr-dims')!;
    this.actionsEl = root.querySelector('#imcr-actions')!;
    this.formatSelect = root.querySelector('#imcr-format')!;
    this.qualitySlider = root.querySelector('#imcr-quality')!;
    this.qualityVal = root.querySelector('#imcr-quality-val')!;
    this.ratioButtons = root.querySelector('#imcr-ratios')!;

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
    });

    this.formatSelect.addEventListener('change', () => {
      const qualityGroup = document.getElementById('imcr-quality-group')!;
      qualityGroup.style.display = this.formatSelect.value === 'image/png' ? 'none' : '';
    });

    this.ratioButtons.querySelectorAll('.imcr-ratio-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.ratioButtons
          .querySelectorAll('.imcr-ratio-btn')
          .forEach((b) => b.classList.remove('imcr-ratio-btn--active'));
        btn.classList.add('imcr-ratio-btn--active');
        const val = (btn as HTMLElement).dataset.ratio;
        this.lockedRatio = val === '' ? null : parseFloat(val!);
        if (this.lockedRatio && this.image) {
          this.enforceRatio();
          this.draw();
        }
      });
    });

    // Pointer events for crop handles
    this.canvasEl.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvasEl.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvasEl.addEventListener('pointerup', () => this.onPointerUp());
    this.canvasEl.addEventListener('pointerleave', () => this.onPointerUp());

    root.querySelector('#imcr-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imcr-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFile(file));
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image file');
      return;
    }
    this.image = await loadImage(file);
    this.cx = 0;
    this.cy = 0;
    this.cw = this.image.naturalWidth;
    this.ch = this.image.naturalHeight;

    const max = 600;
    this.displayScale = Math.min(max / this.image.naturalWidth, max / this.image.naturalHeight, 1);
    this.canvasEl.width = Math.round(this.image.naturalWidth * this.displayScale);
    this.canvasEl.height = Math.round(this.image.naturalHeight * this.displayScale);

    this.showUI();
    this.draw();
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    document.getElementById('imcr-canvas-wrap')!.style.display = '';
    this.actionsEl.style.display = '';
  }

  private enforceRatio(): void {
    if (!this.lockedRatio) return;
    const r = this.lockedRatio;
    if (this.cw / this.ch > r) {
      this.cw = Math.round(this.ch * r);
    } else {
      this.ch = Math.round(this.cw / r);
    }
    this.clamp();
  }

  private clamp(): void {
    if (!this.image) return;
    const iw = this.image.naturalWidth;
    const ih = this.image.naturalHeight;
    this.cx = Math.max(0, Math.min(this.cx, iw - this.cw));
    this.cy = Math.max(0, Math.min(this.cy, ih - this.ch));
    this.cw = Math.max(10, Math.min(this.cw, iw - this.cx));
    this.ch = Math.max(10, Math.min(this.ch, ih - this.cy));
  }

  private draw(): void {
    if (!this.image) return;
    const ctx = this.canvasEl.getContext('2d')!;
    const s = this.displayScale;
    const cw = this.canvasEl.width;
    const ch = this.canvasEl.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(this.image, 0, 0, cw, ch);

    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, cw, this.cy * s); // top
    ctx.fillRect(0, (this.cy + this.ch) * s, cw, ch - (this.cy + this.ch) * s); // bottom
    ctx.fillRect(0, this.cy * s, this.cx * s, this.ch * s); // left
    ctx.fillRect((this.cx + this.cw) * s, this.cy * s, cw - (this.cx + this.cw) * s, this.ch * s); // right

    // Crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.cx * s, this.cy * s, this.cw * s, this.ch * s);

    // Handles
    const hs = 8;
    ctx.fillStyle = '#fff';
    const handles = this.getHandlePositions();
    for (const [, hx, hy] of handles) {
      ctx.fillRect(hx * s - hs / 2, hy * s - hs / 2, hs, hs);
    }

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const lx = this.cx + (this.cw * i) / 3;
      const ly = this.cy + (this.ch * i) / 3;
      ctx.beginPath();
      ctx.moveTo(lx * s, this.cy * s);
      ctx.lineTo(lx * s, (this.cy + this.ch) * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.cx * s, ly * s);
      ctx.lineTo((this.cx + this.cw) * s, ly * s);
      ctx.stroke();
    }

    this.dimEl.textContent = `${this.cw} × ${this.ch} px`;
  }

  private getHandlePositions(): Array<[Handle, number, number]> {
    const { cx, cy, cw, ch } = this;
    const mx = cx + cw / 2;
    const my = cy + ch / 2;
    return [
      ['nw', cx, cy],
      ['ne', cx + cw, cy],
      ['sw', cx, cy + ch],
      ['se', cx + cw, cy + ch],
      ['n', mx, cy],
      ['s', mx, cy + ch],
      ['w', cx, my],
      ['e', cx + cw, my],
    ];
  }

  private hitTest(ex: number, ey: number): Handle {
    const s = this.displayScale;
    const threshold = 12;
    for (const [handle, hx, hy] of this.getHandlePositions()) {
      const dx = ex - hx * s;
      const dy = ey - hy * s;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return handle;
    }
    // Check if inside crop area for move
    const x = ex / s;
    const y = ey / s;
    if (x >= this.cx && x <= this.cx + this.cw && y >= this.cy && y <= this.cy + this.ch)
      return 'move';
    return null;
  }

  private onPointerDown(e: PointerEvent): void {
    const rect = this.canvasEl.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    this.activeHandle = this.hitTest(ex, ey);
    if (!this.activeHandle) return;
    this.canvasEl.setPointerCapture(e.pointerId);
    this.startX = ex;
    this.startY = ey;
    this.startCx = this.cx;
    this.startCy = this.cy;
    this.startCw = this.cw;
    this.startCh = this.ch;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.activeHandle || !this.image) return;
    const rect = this.canvasEl.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const s = this.displayScale;
    const dx = (ex - this.startX) / s;
    const dy = (ey - this.startY) / s;

    const iw = this.image.naturalWidth;
    const ih = this.image.naturalHeight;

    if (this.activeHandle === 'move') {
      this.cx = Math.max(0, Math.min(this.startCx + dx, iw - this.startCw));
      this.cy = Math.max(0, Math.min(this.startCy + dy, ih - this.startCh));
    } else {
      let ncx = this.startCx,
        ncy = this.startCy,
        ncw = this.startCw,
        nch = this.startCh;

      if (this.activeHandle.includes('w')) {
        ncx = this.startCx + dx;
        ncw = this.startCw - dx;
      }
      if (this.activeHandle.includes('e')) {
        ncw = this.startCw + dx;
      }
      if (this.activeHandle.includes('n')) {
        ncy = this.startCy + dy;
        nch = this.startCh - dy;
      }
      if (this.activeHandle.includes('s')) {
        nch = this.startCh + dy;
      }

      // Enforce minimum
      ncw = Math.max(10, ncw);
      nch = Math.max(10, nch);

      // Enforce ratio
      if (this.lockedRatio) {
        if (this.activeHandle === 'n' || this.activeHandle === 's') {
          ncw = Math.round(nch * this.lockedRatio);
        } else if (this.activeHandle === 'w' || this.activeHandle === 'e') {
          nch = Math.round(ncw / this.lockedRatio);
        } else {
          // Corner: use the larger dimension
          if (Math.abs(dx) > Math.abs(dy)) {
            nch = Math.round(ncw / this.lockedRatio);
          } else {
            ncw = Math.round(nch * this.lockedRatio);
          }
        }
      }

      // Clamp to image bounds
      ncx = Math.max(0, ncx);
      ncy = Math.max(0, ncy);
      if (ncx + ncw > iw) ncw = iw - ncx;
      if (ncy + nch > ih) nch = ih - ncy;

      this.cx = ncx;
      this.cy = ncy;
      this.cw = ncw;
      this.ch = nch;
    }

    this.draw();
  }

  private onPointerUp(): void {
    this.activeHandle = null;
  }

  private async download(): Promise<void> {
    if (!this.image) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;

    const offscreen = document.createElement('canvas');
    offscreen.width = this.cw;
    offscreen.height = this.ch;
    const ctx = offscreen.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, this.cw, this.ch);
    }
    ctx.drawImage(this.image, this.cx, this.cy, this.cw, this.ch, 0, 0, this.cw, this.ch);

    const blob = await canvasToBlob(offscreen, format, quality);
    const ext = getExtFromMime(format);
    downloadBlob(blob, `cropped-${this.cw}x${this.ch}.${ext}`);
    Toast.success('Cropped image downloaded');
    logToolAction('image-crop', 'Downloaded cropped image');
  }

  private reset(): void {
    this.image = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    document.getElementById('imcr-canvas-wrap')!.style.display = 'none';
    this.actionsEl.style.display = 'none';
  }

  destroy(): void {
    this.cleanupPaste?.();
  }
}
