import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import {
  bindClipboardPaste,
  canvasToBlob,
  createMultiDropZone,
  downloadBlob,
  downloadZip,
  formatBytes,
  getExtFromMime,
  getFitSize,
  loadImage,
} from '../../../utils/image';

type ResizeMode = 'px' | 'pct' | 'fit';

export class ImageResize {
  id = 'image-resize';
  name = 'Image Resizer';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M15 3h6v6M9 21H3v-6"/>
      <path d="M21 3l-7 7M3 21l7-7"/>
    </svg>`;

  private files: File[] = [];
  private dropZone!: HTMLDivElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private modeSelect!: HTMLSelectElement;
  private pxGroup!: HTMLDivElement;
  private widthInput!: HTMLInputElement;
  private heightInput!: HTMLInputElement;
  private lockCheckbox!: HTMLInputElement;
  private pctGroup!: HTMLDivElement;
  private pctInput!: HTMLInputElement;
  private fitGroup!: HTMLDivElement;
  private fitWInput!: HTMLInputElement;
  private fitHInput!: HTMLInputElement;
  private canvas!: HTMLCanvasElement;
  private sizeEl!: HTMLSpanElement;
  private fileListEl!: HTMLDivElement;
  private originalImage: HTMLImageElement | null = null;
  private aspectRatio = 1;
  private cleanupPaste!: () => void;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imgr-dropzone"></div>
        <div class="imgc-controls" id="imgr-controls" style="display:none;">
          <div class="form-group">
            <label class="label">Mode</label>
            <select class="input" id="imgr-mode" style="width:auto;">
              <option value="px">Exact Pixels</option>
              <option value="pct">Percentage</option>
              <option value="fit">Fit Within Bounds</option>
            </select>
          </div>
          <div id="imgr-px-group">
            <div class="form-group">
              <label class="label">Width (px)</label>
              <input type="number" class="input" id="imgr-width" min="1" max="10000" style="width:120px;">
            </div>
            <div class="form-group">
              <label class="label">Height (px)</label>
              <input type="number" class="input" id="imgr-height" min="1" max="10000" style="width:120px;">
            </div>
            <div class="form-group" style="align-self:flex-end;">
              <label class="checkbox-label">
                <input type="checkbox" id="imgr-lock" checked> Lock aspect ratio
              </label>
            </div>
          </div>
          <div id="imgr-pct-group" style="display:none;">
            <div class="form-group">
              <label class="label">Scale (%)</label>
              <input type="number" class="input" id="imgr-pct" value="50" min="1" max="1000" style="width:100px;">
            </div>
          </div>
          <div id="imgr-fit-group" style="display:none;">
            <div class="form-group">
              <label class="label">Max Width (px)</label>
              <input type="number" class="input" id="imgr-fit-w" value="1920" min="1" max="10000" style="width:120px;">
            </div>
            <div class="form-group">
              <label class="label">Max Height (px)</label>
              <input type="number" class="input" id="imgr-fit-h" value="1080" min="1" max="10000" style="width:120px;">
            </div>
          </div>
        </div>
        <div class="imgc-batch-list" id="imgr-batch" style="display:none;"></div>
        <div class="imgc-preview" id="imgr-preview" style="display:none;">
          <div class="imgc-preview__item" style="max-width:100%;">
            <label class="label">Preview</label>
            <canvas id="imgr-canvas" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgr-size">—</span>
          </div>
        </div>
        <div class="tool-actions" id="imgr-actions" style="display:none;">
          <button class="btn btn--primary" id="imgr-download">Download</button>
          <button class="btn btn--primary" id="imgr-download-all" style="display:none;">Resize All (ZIP)</button>
          <button class="btn btn--ghost" id="imgr-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = createMultiDropZone({
      id: 'imgr-dropzone',
      hint: 'Supports PNG, JPEG, WebP — drop multiple for batch',
      onFiles: (files) => this.handleFiles(files),
    });
    root.querySelector('#imgr-dropzone')!.replaceWith(this.dropZone);

    this.controlsEl = root.querySelector('#imgr-controls')!;
    this.previewEl = root.querySelector('#imgr-preview')!;
    this.actionsEl = root.querySelector('#imgr-actions')!;
    this.modeSelect = root.querySelector('#imgr-mode')!;
    this.pxGroup = root.querySelector('#imgr-px-group')!;
    this.widthInput = root.querySelector('#imgr-width')!;
    this.heightInput = root.querySelector('#imgr-height')!;
    this.lockCheckbox = root.querySelector('#imgr-lock')!;
    this.pctGroup = root.querySelector('#imgr-pct-group')!;
    this.pctInput = root.querySelector('#imgr-pct')!;
    this.fitGroup = root.querySelector('#imgr-fit-group')!;
    this.fitWInput = root.querySelector('#imgr-fit-w')!;
    this.fitHInput = root.querySelector('#imgr-fit-h')!;
    this.canvas = root.querySelector('#imgr-canvas')!;
    this.sizeEl = root.querySelector('#imgr-size')!;
    this.fileListEl = root.querySelector('#imgr-batch')!;

    this.modeSelect.addEventListener('change', () => this.switchMode());

    this.widthInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked && this.aspectRatio) {
        this.heightInput.value = String(
          Math.round(parseInt(this.widthInput.value || '0') / this.aspectRatio),
        );
      }
      this.resize();
    });
    this.heightInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked && this.aspectRatio) {
        this.widthInput.value = String(
          Math.round(parseInt(this.heightInput.value || '0') * this.aspectRatio),
        );
      }
      this.resize();
    });
    this.lockCheckbox.addEventListener('change', () => this.resize());
    this.pctInput.addEventListener('input', () => this.resize());
    this.fitWInput.addEventListener('input', () => this.resize());
    this.fitHInput.addEventListener('input', () => this.resize());

    root.querySelector('#imgr-download')!.addEventListener('click', () => this.downloadSingle());
    root.querySelector('#imgr-download-all')!.addEventListener('click', () => this.downloadAll());
    root.querySelector('#imgr-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFiles([file]));
  }

  private switchMode(): void {
    const mode = this.modeSelect.value as ResizeMode;
    this.pxGroup.style.display = mode === 'px' ? '' : 'none';
    this.pctGroup.style.display = mode === 'pct' ? '' : 'none';
    this.fitGroup.style.display = mode === 'fit' ? '' : 'none';
    this.resize();
  }

  private async handleFiles(files: File[]): Promise<void> {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      Toast.error('No image files found');
      return;
    }
    this.files = images;
    this.originalImage = await loadImage(images[0]);
    this.aspectRatio = this.originalImage.width / this.originalImage.height;
    this.widthInput.value = String(this.originalImage.width);
    this.heightInput.value = String(this.originalImage.height);
    this.showUI();
    if (images.length > 1) {
      this.renderFileList();
    } else {
      this.fileListEl.style.display = 'none';
    }
    this.resize();
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    this.previewEl.style.display = '';
    this.actionsEl.style.display = '';
    const dlAll = this.actionsEl.querySelector('#imgr-download-all') as HTMLElement;
    dlAll.style.display = this.files.length > 1 ? '' : 'none';
    (this.actionsEl.querySelector('#imgr-download') as HTMLElement).style.display =
      this.files.length === 1 ? '' : 'none';
  }

  private renderFileList(): void {
    this.fileListEl.style.display = '';
    this.fileListEl.innerHTML = `
      <div class="imgc-batch-header"><span>${this.files.length} files</span></div>
      ${this.files
        .map(
          (f, i) => `
        <div class="imgc-batch-item">
          <span class="imgc-batch-item__name">${f.name}</span>
          <span class="imgc-batch-item__size">${formatBytes(f.size)}</span>
          <span class="imgc-batch-item__status" id="imgr-status-${i}">pending</span>
        </div>
      `,
        )
        .join('')}
    `;
  }

  private getTargetSize(img: HTMLImageElement): { w: number; h: number } {
    const mode = this.modeSelect.value as ResizeMode;
    if (mode === 'px') {
      return {
        w: parseInt(this.widthInput.value) || img.width,
        h: parseInt(this.heightInput.value) || img.height,
      };
    }
    if (mode === 'pct') {
      const pct = parseInt(this.pctInput.value) || 100;
      return { w: Math.round((img.width * pct) / 100), h: Math.round((img.height * pct) / 100) };
    }
    // fit
    const maxW = parseInt(this.fitWInput.value) || 1920;
    const maxH = parseInt(this.fitHInput.value) || 1080;
    const fit = getFitSize(img.width, img.height, maxW, maxH);
    return { w: fit.width, h: fit.height };
  }

  private resize(): void {
    if (!this.originalImage) return;
    const { w, h } = this.getTargetSize(this.originalImage);
    const max = 500;
    const ratio = Math.min(max / w, max / h, 1);
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.canvas
      .getContext('2d')!
      .drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);
    this.sizeEl.textContent = `${w} × ${h} px`;
  }

  private async downloadSingle(): Promise<void> {
    if (!this.files[0] || !this.originalImage) return;
    const { w, h } = this.getTargetSize(this.originalImage);
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    offscreen.getContext('2d')!.drawImage(this.originalImage, 0, 0, w, h);
    const ext = this.files[0].name.split('.').pop()?.toLowerCase() || 'png';
    const mime =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
    const blob = await canvasToBlob(offscreen, mime);
    downloadBlob(blob, this.files[0].name.replace(/\.[^.]+$/, '') + `-${w}x${h}.${ext}`);
    Toast.success('Downloaded');
    logToolAction('image-resize', 'Downloaded resized image');
  }

  private async downloadAll(): Promise<void> {
    if (this.files.length < 2) return;
    const results: Array<{ name: string; data: Blob }> = [];
    for (let i = 0; i < this.files.length; i++) {
      const statusEl = document.getElementById(`imgr-status-${i}`);
      if (statusEl) statusEl.textContent = 'processing...';
      try {
        const img = await loadImage(this.files[i]);
        const { w, h } = this.getTargetSize(img);
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        offscreen.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const ext = this.files[i].name.split('.').pop()?.toLowerCase() || 'png';
        const mime =
          ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/png';
        const blob = await canvasToBlob(offscreen, mime);
        results.push({
          name: this.files[i].name.replace(/\.[^.]+$/, `-${w}x${h}.${ext}`),
          data: blob,
        });
        if (statusEl) statusEl.textContent = '✓';
      } catch {
        if (statusEl) statusEl.textContent = '✗ error';
      }
    }
    await downloadZip(results, 'resized-images.zip');
    Toast.success(`Downloaded ${results.length} files as ZIP`);
    logToolAction('image-resize', `Downloaded ${results.length} resized images as ZIP`);
  }

  private reset(): void {
    this.files = [];
    this.originalImage = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    this.previewEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.fileListEl.style.display = 'none';
  }

  destroy(): void {
    this.cleanupPaste?.();
  }
}
