import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import {
  bindClipboardPaste,
  canvasToBlob,
  createDropZone,
  downloadBlob,
  formatBytes,
  getExtFromMime,
  loadImage,
} from '../../../utils/image';

export class ImageCompress {
  id = 'image-compress';
  name = 'Image Compressor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M12 8v8M8 12h8"/>
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke-width="1"/>
    </svg>`;
  badge = 'Popular';

  private dropZone!: HTMLDivElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;
  private formatSelect!: HTMLSelectElement;
  private targetInput!: HTMLInputElement;
  private exifCheckbox!: HTMLInputElement;
  private progressiveNote!: HTMLDivElement;
  private originalSizeEl!: HTMLSpanElement;
  private compressedSizeEl!: HTMLSpanElement;
  private savingsEl!: HTMLSpanElement;
  private sizeBarEl!: HTMLDivElement;
  private originalCanvas!: HTMLCanvasElement;
  private compressedCanvas!: HTMLCanvasElement;
  private originalFile: File | null = null;
  private originalImage: HTMLImageElement | null = null;
  private cleanupPaste!: () => void;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imgc-dropzone"></div>
        <div class="imgc-controls" id="imgc-controls" style="display:none;">
          <div class="form-group" style="flex:1;">
            <label class="label">Quality: <span id="imgc-quality-val">80</span>%</label>
            <input type="range" id="imgc-quality" min="1" max="100" value="80" class="password-slider">
          </div>
          <div class="form-group">
            <label class="label">Format</label>
            <select class="input" id="imgc-format" style="width:auto;">
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Target Size (KB)</label>
            <input type="number" class="input" id="imgc-target" placeholder="e.g. 200" min="1" style="width:100px;">
          </div>
          <div class="form-group" style="align-self:flex-end;">
            <button class="btn btn--ghost btn--sm" id="imgc-auto">Auto-compress</button>
          </div>
        </div>
        <div class="imgc-exif-row" id="imgc-exif-row" style="display:none;">
          <label class="checkbox-label">
            <input type="checkbox" id="imgc-exif" checked> Strip EXIF metadata (Canvas redraw)
          </label>
          <span class="imgc-note">Progressive JPEG requires server-side encoding — Canvas outputs baseline only.</span>
        </div>
        <div class="imgc-preview" id="imgc-preview" style="display:none;">
          <div class="imgc-preview__item">
            <label class="label">Original</label>
            <canvas id="imgc-original" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgc-original-size">—</span>
          </div>
          <div class="imgc-preview__item">
            <label class="label">Compressed</label>
            <canvas id="imgc-compressed" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgc-compressed-size">—</span>
          </div>
          <div class="imgc-bar-wrap" id="imgc-bar-wrap" style="display:none;">
            <div class="imgc-bar">
              <div class="imgc-bar__fill" id="imgc-bar-fill"></div>
            </div>
            <div class="imgc-savings" id="imgc-savings"></div>
          </div>
        </div>
        <div class="tool-actions" id="imgc-actions" style="display:none;">
          <button class="btn btn--primary" id="imgc-download">Download</button>
          <button class="btn btn--ghost" id="imgc-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = createDropZone({
      id: 'imgc-dropzone',
      hint: 'Supports PNG, JPEG, WebP',
      onFile: (file) => this.handleFile(file),
    });
    root.querySelector('#imgc-dropzone')!.replaceWith(this.dropZone);

    this.controlsEl = root.querySelector('#imgc-controls')!;
    this.previewEl = root.querySelector('#imgc-preview')!;
    this.actionsEl = root.querySelector('#imgc-actions')!;
    this.qualitySlider = root.querySelector('#imgc-quality')!;
    this.qualityVal = root.querySelector('#imgc-quality-val')!;
    this.formatSelect = root.querySelector('#imgc-format')!;
    this.targetInput = root.querySelector('#imgc-target')!;
    this.exifCheckbox = root.querySelector('#imgc-exif')!;
    this.progressiveNote = root.querySelector('#imgc-exif-row')!;
    this.originalSizeEl = root.querySelector('#imgc-original-size')!;
    this.compressedSizeEl = root.querySelector('#imgc-compressed-size')!;
    this.savingsEl = root.querySelector('#imgc-savings')!;
    this.sizeBarEl = root.querySelector('#imgc-bar-fill')!;
    this.originalCanvas = root.querySelector('#imgc-original')!;
    this.compressedCanvas = root.querySelector('#imgc-compressed')!;

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
      this.compress();
    });

    this.formatSelect.addEventListener('change', () => this.compress());

    root.querySelector('#imgc-auto')!.addEventListener('click', () => this.autoCompress());
    root.querySelector('#imgc-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imgc-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFile(file));
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image file');
      return;
    }
    this.originalFile = file;
    this.originalImage = await loadImage(file);
    this.showUI();
    this.drawOriginal();
    this.compress();
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    this.previewEl.style.display = '';
    this.actionsEl.style.display = '';
    this.progressiveNote.style.display = '';
  }

  private drawOriginal(): void {
    if (!this.originalImage) return;
    const max = 300;
    const ratio = Math.min(max / this.originalImage.width, max / this.originalImage.height, 1);
    this.originalCanvas.width = Math.round(this.originalImage.width * ratio);
    this.originalCanvas.height = Math.round(this.originalImage.height * ratio);
    this.originalCanvas
      .getContext('2d')!
      .drawImage(this.originalImage, 0, 0, this.originalCanvas.width, this.originalCanvas.height);
    this.originalSizeEl.textContent = formatBytes(this.originalFile!.size);
  }

  private async compress(): Promise<void> {
    if (!this.originalImage) return;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const format = this.formatSelect.value as string;

    const max = 1600;
    const ratio = Math.min(max / this.originalImage.width, max / this.originalImage.height, 1);
    const w = Math.round(this.originalImage.width * ratio);
    const h = Math.round(this.originalImage.height * ratio);
    this.compressedCanvas.width = w;
    this.compressedCanvas.height = h;
    const ctx = this.compressedCanvas.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(this.originalImage, 0, 0, w, h);

    const blob = await canvasToBlob(this.compressedCanvas, format, quality);
    this.compressedSizeEl.textContent = formatBytes(blob.size);
    const original = this.originalFile!.size;
    const savings = (1 - blob.size / original) * 100;

    const barWrap = document.getElementById('imgc-bar-wrap')!;
    barWrap.style.display = '';
    const pct = Math.min((blob.size / original) * 100, 100);
    this.sizeBarEl.style.width = `${pct}%`;
    this.sizeBarEl.style.background = savings > 0 ? 'var(--color-success)' : 'var(--color-error)';

    this.savingsEl.textContent =
      savings > 0
        ? `${savings.toFixed(1)}% smaller`
        : savings < 0
          ? `${Math.abs(savings).toFixed(1)}% larger (try lower quality)`
          : 'Same size';
    this.savingsEl.className =
      'imgc-savings ' +
      (savings > 0 ? 'imgc-savings--positive' : savings < 0 ? 'imgc-savings--negative' : '');
  }

  private async autoCompress(): Promise<void> {
    const targetKB = parseInt(this.targetInput.value);
    if (!targetKB || targetKB <= 0) {
      Toast.error('Enter a target size in KB');
      return;
    }
    if (!this.originalImage) return;

    const targetBytes = targetKB * 1024;
    const format = this.formatSelect.value as string;

    let low = 1,
      high = 100,
      best = 1;
    for (let i = 0; i < 10; i++) {
      const mid = Math.round((low + high) / 2);
      const blob = await canvasToBlob(this.compressedCanvas, format, mid / 100);
      if (blob.size <= targetBytes) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    this.qualitySlider.value = String(best);
    this.qualityVal.textContent = String(best);
    await this.compress();
    Toast.success(`Compressed to quality ${best}%`);
  }

  private async download(): Promise<void> {
    if (!this.originalImage) return;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const format = this.formatSelect.value as string;

    const offscreen = document.createElement('canvas');
    offscreen.width = this.originalImage.naturalWidth;
    offscreen.height = this.originalImage.naturalHeight;
    const ctx = offscreen.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    }
    ctx.drawImage(this.originalImage, 0, 0);

    const blob = await canvasToBlob(offscreen, format, quality);
    const ext = getExtFromMime(format);
    downloadBlob(blob, this.originalFile!.name.replace(/\.[^.]+$/, '') + `-compressed.${ext}`);
    Toast.success('Downloaded');
    logToolAction('image-compress', 'Downloaded compressed image');
  }

  private reset(): void {
    this.originalFile = null;
    this.originalImage = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    this.previewEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.progressiveNote.style.display = 'none';
    document.getElementById('imgc-bar-wrap')!.style.display = 'none';
  }

  destroy(): void {
    this.cleanupPaste?.();
  }
}
