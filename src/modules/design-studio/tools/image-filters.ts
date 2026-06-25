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

type FilterName = 'grayscale' | 'sepia' | 'invert';

interface FilterState {
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
  brightness: number; // -100..100
  contrast: number; // -100..100
  blur: number; // 0..5
  sharpen: boolean;
}

export class ImageFilters {
  id = 'image-filters';
  name = 'Image Filters';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>
      <line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2c2.5 3.5 4 7.5 4 10s-1.5 6.5-4 10"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private controlsEl!: HTMLDivElement;
  private canvasWrap!: HTMLDivElement;
  private originalCanvas!: HTMLCanvasElement;
  private filteredCanvas!: HTMLCanvasElement;
  private actionsEl!: HTMLDivElement;
  private formatSelect!: HTMLSelectElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;

  private image: HTMLImageElement | null = null;
  private originalData: ImageData | null = null;
  private state: FilterState = {
    grayscale: false,
    sepia: false,
    invert: false,
    brightness: 0,
    contrast: 0,
    blur: 0,
    sharpen: false,
  };
  private cleanupPaste!: () => void;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imgf-dropzone"></div>
        <div class="imgf-controls" id="imgf-controls" style="display:none;">
          <div class="imgf-toggles">
            <button class="btn btn--ghost btn--sm imgf-toggle" data-filter="grayscale">Grayscale</button>
            <button class="btn btn--ghost btn--sm imgf-toggle" data-filter="sepia">Sepia</button>
            <button class="btn btn--ghost btn--sm imgf-toggle" data-filter="invert">Invert</button>
            <button class="btn btn--ghost btn--sm imgf-toggle" data-filter="sharpen">Sharpen</button>
          </div>
          <div class="imgf-sliders">
            <div class="form-group">
              <label class="label">Brightness: <span id="imgf-brightness-val">0</span></label>
              <input type="range" id="imgf-brightness" min="-100" max="100" value="0" class="password-slider">
            </div>
            <div class="form-group">
              <label class="label">Contrast: <span id="imgf-contrast-val">0</span></label>
              <input type="range" id="imgf-contrast" min="-100" max="100" value="0" class="password-slider">
            </div>
            <div class="form-group">
              <label class="label">Blur: <span id="imgf-blur-val">0</span>px</label>
              <input type="range" id="imgf-blur" min="0" max="5" value="0" step="0.5" class="password-slider">
            </div>
          </div>
          <div class="form-group">
            <label class="label">Export Format</label>
            <select class="input" id="imgf-format" style="width:auto;">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div class="form-group" id="imgf-quality-group">
            <label class="label">Quality: <span id="imgf-quality-val">90</span>%</label>
            <input type="range" id="imgf-quality" min="1" max="100" value="90" class="password-slider">
          </div>
        </div>
        <div class="imgf-canvas-wrap" id="imgf-canvas-wrap" style="display:none;">
          <div class="imgf-split">
            <div class="imgf-split__item">
              <label class="label">Original</label>
              <canvas id="imgf-original" class="imgf-canvas"></canvas>
            </div>
            <div class="imgf-split__item">
              <label class="label">Filtered</label>
              <canvas id="imgf-filtered" class="imgf-canvas"></canvas>
            </div>
          </div>
        </div>
        <div class="tool-actions" id="imgf-actions" style="display:none;">
          <button class="btn btn--ghost" id="imgf-reset-filters">Reset Filters</button>
          <button class="btn btn--primary" id="imgf-download">Download</button>
          <button class="btn btn--ghost" id="imgf-reset">Load New</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = createDropZone({
      id: 'imgf-dropzone',
      hint: 'Supports PNG, JPEG, WebP',
      onFile: (file) => this.handleFile(file),
    });
    root.querySelector('#imgf-dropzone')!.replaceWith(this.dropZone);

    this.controlsEl = root.querySelector('#imgf-controls')!;
    this.canvasWrap = root.querySelector('#imgf-canvas-wrap')!;
    this.originalCanvas = root.querySelector('#imgf-original')!;
    this.filteredCanvas = root.querySelector('#imgf-filtered')!;
    this.actionsEl = root.querySelector('#imgf-actions')!;
    this.formatSelect = root.querySelector('#imgf-format')!;
    this.qualitySlider = root.querySelector('#imgf-quality')!;
    this.qualityVal = root.querySelector('#imgf-quality-val')!;

    // Toggle buttons
    root.querySelectorAll('.imgf-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = (btn as HTMLElement).dataset.filter as FilterName | 'sharpen';
        if (filter === 'sharpen') {
          this.state.sharpen = !this.state.sharpen;
          btn.classList.toggle('imgf-toggle--active', this.state.sharpen);
        } else {
          this.state[filter] = !this.state[filter];
          btn.classList.toggle('imgf-toggle--active', this.state[filter]);
        }
        this.applyFilters();
      });
    });

    // Sliders
    const brightnessSlider = root.querySelector('#imgf-brightness') as HTMLInputElement;
    const contrastSlider = root.querySelector('#imgf-contrast') as HTMLInputElement;
    const blurSlider = root.querySelector('#imgf-blur') as HTMLInputElement;

    brightnessSlider.addEventListener('input', () => {
      this.state.brightness = parseInt(brightnessSlider.value);
      root.querySelector('#imgf-brightness-val')!.textContent = brightnessSlider.value;
      this.debouncedApply();
    });
    contrastSlider.addEventListener('input', () => {
      this.state.contrast = parseInt(contrastSlider.value);
      root.querySelector('#imgf-contrast-val')!.textContent = contrastSlider.value;
      this.debouncedApply();
    });
    blurSlider.addEventListener('input', () => {
      this.state.blur = parseFloat(blurSlider.value);
      root.querySelector('#imgf-blur-val')!.textContent = blurSlider.value;
      this.debouncedApply();
    });

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
    });

    this.formatSelect.addEventListener('change', () => {
      const qualityGroup = document.getElementById('imgf-quality-group')!;
      qualityGroup.style.display = this.formatSelect.value === 'image/png' ? 'none' : '';
    });

    root.querySelector('#imgf-reset-filters')!.addEventListener('click', () => this.resetFilters());
    root.querySelector('#imgf-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imgf-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFile(file));
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image file');
      return;
    }
    this.image = await loadImage(file);

    const max = 400;
    const ratio = Math.min(max / this.image.naturalWidth, max / this.image.naturalHeight, 1);
    const w = Math.round(this.image.naturalWidth * ratio);
    const h = Math.round(this.image.naturalHeight * ratio);

    this.originalCanvas.width = w;
    this.originalCanvas.height = h;
    this.filteredCanvas.width = w;
    this.filteredCanvas.height = h;

    const ctx = this.originalCanvas.getContext('2d')!;
    ctx.drawImage(this.image, 0, 0, w, h);
    this.originalData = ctx.getImageData(0, 0, w, h);

    this.showUI();
    this.applyFilters();
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    this.canvasWrap.style.display = '';
    this.actionsEl.style.display = '';
  }

  private debouncedApply(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.applyFilters(), 50);
  }

  private applyFilters(): void {
    if (!this.originalData) return;
    const ctx = this.filteredCanvas.getContext('2d')!;
    const imageData = new ImageData(
      new Uint8ClampedArray(this.originalData.data),
      this.originalData.width,
      this.originalData.height,
    );
    const d = imageData.data;

    // Apply per-pixel filters
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i],
        g = d[i + 1],
        b = d[i + 2];

      // Grayscale
      if (this.state.grayscale) {
        const avg = (r + g + b) / 3;
        r = g = b = avg;
      }

      // Sepia
      if (this.state.sepia) {
        const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        const sg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        const sb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        r = sr;
        g = sg;
        b = sb;
      }

      // Invert
      if (this.state.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Brightness
      if (this.state.brightness !== 0) {
        r = Math.max(0, Math.min(255, r + this.state.brightness));
        g = Math.max(0, Math.min(255, g + this.state.brightness));
        b = Math.max(0, Math.min(255, b + this.state.brightness));
      }

      // Contrast
      if (this.state.contrast !== 0) {
        const factor = (259 * (this.state.contrast + 255)) / (255 * (259 - this.state.contrast));
        r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);

    // Blur (box blur via pixel iteration)
    if (this.state.blur > 0) {
      this.applyBoxBlur(
        ctx,
        this.filteredCanvas.width,
        this.filteredCanvas.height,
        Math.round(this.state.blur),
      );
    }

    // Sharpen (unsharp mask)
    if (this.state.sharpen) {
      this.applySharpen(ctx, this.filteredCanvas.width, this.filteredCanvas.height);
    }
  }

  private applyBoxBlur(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number): void {
    if (radius < 1) return;
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const copy = new Uint8ClampedArray(d);
    const size = radius * 2 + 1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(w - 1, x + dx));
            const ny = Math.max(0, Math.min(h - 1, y + dy));
            const idx = (ny * w + nx) * 4;
            r += copy[idx];
            g += copy[idx + 1];
            b += copy[idx + 2];
            count++;
          }
        }
        const idx = (y * w + x) * 4;
        d[idx] = r / count;
        d[idx + 1] = g / count;
        d[idx + 2] = b / count;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const copy = new Uint8ClampedArray(d);
    // Sharpen kernel: [0,-1,0, -1,5,-1, 0,-1,0]
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;
        let ki = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            r += copy[idx] * kernel[ki];
            g += copy[idx + 1] * kernel[ki];
            b += copy[idx + 2] * kernel[ki];
            ki++;
          }
        }
        const idx = (y * w + x) * 4;
        d[idx] = Math.max(0, Math.min(255, r));
        d[idx + 1] = Math.max(0, Math.min(255, g));
        d[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private resetFilters(): void {
    this.state = {
      grayscale: false,
      sepia: false,
      invert: false,
      brightness: 0,
      contrast: 0,
      blur: 0,
      sharpen: false,
    };
    document
      .querySelectorAll('.imgf-toggle')
      .forEach((b) => b.classList.remove('imgf-toggle--active'));
    (document.getElementById('imgf-brightness') as HTMLInputElement).value = '0';
    (document.getElementById('imgf-contrast') as HTMLInputElement).value = '0';
    (document.getElementById('imgf-blur') as HTMLInputElement).value = '0';
    document.getElementById('imgf-brightness-val')!.textContent = '0';
    document.getElementById('imgf-contrast-val')!.textContent = '0';
    document.getElementById('imgf-blur-val')!.textContent = '0';
    this.applyFilters();
  }

  private async download(): Promise<void> {
    if (!this.image) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;

    // Render at full resolution
    const offscreen = document.createElement('canvas');
    offscreen.width = this.image.naturalWidth;
    offscreen.height = this.image.naturalHeight;
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(this.image, 0, 0);

    // Apply same filters to full-res
    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i],
        g = d[i + 1],
        b = d[i + 2];
      if (this.state.grayscale) {
        const avg = (r + g + b) / 3;
        r = g = b = avg;
      }
      if (this.state.sepia) {
        const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        const sg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        const sb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        r = sr;
        g = sg;
        b = sb;
      }
      if (this.state.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }
      if (this.state.brightness !== 0) {
        r = Math.max(0, Math.min(255, r + this.state.brightness));
        g = Math.max(0, Math.min(255, g + this.state.brightness));
        b = Math.max(0, Math.min(255, b + this.state.brightness));
      }
      if (this.state.contrast !== 0) {
        const factor = (259 * (this.state.contrast + 255)) / (255 * (259 - this.state.contrast));
        r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(imageData, 0, 0);

    if (this.state.blur > 0)
      this.applyBoxBlur(ctx, offscreen.width, offscreen.height, Math.round(this.state.blur));
    if (this.state.sharpen) this.applySharpen(ctx, offscreen.width, offscreen.height);

    const blob = await canvasToBlob(offscreen, format, quality);
    const ext = getExtFromMime(format);
    downloadBlob(blob, `filtered.${ext}`);
    Toast.success('Downloaded');
    logToolAction('image-filters', 'Downloaded filtered image');
  }

  private reset(): void {
    this.image = null;
    this.originalData = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    this.canvasWrap.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.resetFilters();
  }

  destroy(): void {
    this.cleanupPaste?.();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
