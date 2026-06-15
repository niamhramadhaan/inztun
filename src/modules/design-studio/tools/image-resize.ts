import { Toast } from '../../../components/Toast';

export class ImageResize {
  id = 'image-resize';
  name = 'Image Resizer';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M15 3h6v6M9 21H3v-6"/>
      <path d="M21 3l-7 7M3 21l7-7"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private fileInput!: HTMLInputElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private widthInput!: HTMLInputElement;
  private heightInput!: HTMLInputElement;
  private lockCheckbox!: HTMLInputElement;
  private canvas!: HTMLCanvasElement;
  private originalFile: File | null = null;
  private originalImage: HTMLImageElement | null = null;
  private aspectRatio = 1;

  render(): string {
    return `
      <div class="tool-area">
        <div class="imgc-drop-zone" id="imgr-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Drop an image here or <strong>click to browse</strong></p>
          <span class="imgc-drop-zone__hint">Supports PNG, JPEG, WebP, GIF</span>
          <input type="file" id="imgr-file" accept="image/*" hidden>
        </div>
        <div class="imgc-controls" id="imgr-controls" style="display:none;">
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
        <div class="imgc-preview" id="imgr-preview" style="display:none;">
          <div class="imgc-preview__item" style="max-width:100%;">
            <label class="label">Preview</label>
            <canvas id="imgr-canvas" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgr-size">—</span>
          </div>
        </div>
        <div class="tool-actions" id="imgr-actions" style="display:none;">
          <button class="btn btn--primary" id="imgr-download">Download</button>
          <button class="btn btn--ghost" id="imgr-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#imgr-dropzone')!;
    this.fileInput = root.querySelector('#imgr-file')!;
    this.controlsEl = root.querySelector('#imgr-controls')!;
    this.previewEl = root.querySelector('#imgr-preview')!;
    this.actionsEl = root.querySelector('#imgr-actions')!;
    this.widthInput = root.querySelector('#imgr-width')!;
    this.heightInput = root.querySelector('#imgr-height')!;
    this.lockCheckbox = root.querySelector('#imgr-lock')!;
    this.canvas = root.querySelector('#imgr-canvas')!;

    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropZone.classList.add('imgc-drop-zone--active'); });
    this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('imgc-drop-zone--active'));
    this.dropZone.addEventListener('drop', (e) => { e.preventDefault(); this.dropZone.classList.remove('imgc-drop-zone--active'); this.handleFile(e.dataTransfer!.files[0]); });
    this.fileInput.addEventListener('change', () => { if (this.fileInput.files?.[0]) this.handleFile(this.fileInput.files[0]); });

    this.widthInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked && this.aspectRatio) {
        this.heightInput.value = String(Math.round(parseInt(this.widthInput.value || '0') / this.aspectRatio));
      }
      this.resize();
    });

    this.heightInput.addEventListener('input', () => {
      if (this.lockCheckbox.checked && this.aspectRatio) {
        this.widthInput.value = String(Math.round(parseInt(this.heightInput.value || '0') * this.aspectRatio));
      }
      this.resize();
    });

    root.querySelector('#imgr-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imgr-reset')!.addEventListener('click', () => this.reset());
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image file');
      return;
    }
    this.originalFile = file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.originalImage = img;
      this.aspectRatio = img.width / img.height;
      this.widthInput.value = String(img.width);
      this.heightInput.value = String(img.height);
      this.showUI();
      this.resize();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    this.previewEl.style.display = '';
    this.actionsEl.style.display = '';
  }

  private resize(): void {
    if (!this.originalImage) return;
    const w = parseInt(this.widthInput.value) || this.originalImage.width;
    const h = parseInt(this.heightInput.value) || this.originalImage.height;

    const { width, height } = this.getScaledSize(w, h, 500);
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d')!;
    ctx.drawImage(this.originalImage, 0, 0, width, height);
    const sizeEl = document.querySelector('#imgr-size') as HTMLSpanElement;
    sizeEl.textContent = `${w} × ${h} px`;
  }

  private download(): void {
    if (!this.originalImage) return;
    const w = parseInt(this.widthInput.value) || this.originalImage.width;
    const h = parseInt(this.heightInput.value) || this.originalImage.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    offscreen.getContext('2d')!.drawImage(this.originalImage, 0, 0, w, h);

    const ext = this.originalFile!.name.split('.').pop()?.toLowerCase() || 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const name = this.originalFile!.name.replace(/\.[^.]+$/, '') + `-${w}x${h}.${ext}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.success('Downloaded');
    }, mime);
  }

  private reset(): void {
    this.originalFile = null;
    this.originalImage = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    this.previewEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.fileInput.value = '';
  }

  private getScaledSize(w: number, h: number, max: number): { width: number; height: number } {
    if (w <= max && h <= max) return { width: w, height: h };
    const ratio = Math.min(max / w, max / h);
    return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
  }

  destroy(): void {}
}
