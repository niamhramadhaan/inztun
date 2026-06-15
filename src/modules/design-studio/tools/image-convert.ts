import { Toast } from '../../../components/Toast';

export class ImageConvert {
  id = 'image-convert';
  name = 'Image Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
      <path d="M12 11v6M9 14l3 3 3-3"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private fileInput!: HTMLInputElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private formatSelect!: HTMLSelectElement;
  private qualityGroup!: HTMLDivElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;
  private canvas!: HTMLCanvasElement;
  private sizeEl!: HTMLSpanElement;
  private originalFile: File | null = null;
  private originalImage: HTMLImageElement | null = null;

  render(): string {
    return `
      <div class="tool-area">
        <div class="imgc-drop-zone" id="imgcv-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Drop an image here or <strong>click to browse</strong></p>
          <span class="imgc-drop-zone__hint">Supports PNG, JPEG, WebP, GIF</span>
          <input type="file" id="imgcv-file" accept="image/*" hidden>
        </div>
        <div class="imgc-controls" id="imgcv-controls" style="display:none;">
          <div class="form-group">
            <label class="label">Convert to</label>
            <select class="input" id="imgcv-format" style="width:auto;">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div class="form-group" id="imgcv-quality-group">
            <label class="label">Quality: <span id="imgcv-quality-val">85</span>%</label>
            <input type="range" id="imgcv-quality" min="1" max="100" value="85" class="password-slider">
          </div>
        </div>
        <div class="imgc-preview" id="imgcv-preview" style="display:none;">
          <div class="imgc-preview__item" style="max-width:100%;">
            <label class="label">Preview</label>
            <canvas id="imgcv-canvas" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgcv-size">—</span>
          </div>
        </div>
        <div class="tool-actions" id="imgcv-actions" style="display:none;">
          <button class="btn btn--primary" id="imgcv-download">Download</button>
          <button class="btn btn--ghost" id="imgcv-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#imgcv-dropzone')!;
    this.fileInput = root.querySelector('#imgcv-file')!;
    this.controlsEl = root.querySelector('#imgcv-controls')!;
    this.previewEl = root.querySelector('#imgcv-preview')!;
    this.actionsEl = root.querySelector('#imgcv-actions')!;
    this.formatSelect = root.querySelector('#imgcv-format')!;
    this.qualityGroup = root.querySelector('#imgcv-quality-group')!;
    this.qualitySlider = root.querySelector('#imgcv-quality')!;
    this.qualityVal = root.querySelector('#imgcv-quality-val')!;
    this.canvas = root.querySelector('#imgcv-canvas')!;
    this.sizeEl = root.querySelector('#imgcv-size')!;

    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropZone.classList.add('imgc-drop-zone--active'); });
    this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('imgc-drop-zone--active'));
    this.dropZone.addEventListener('drop', (e) => { e.preventDefault(); this.dropZone.classList.remove('imgc-drop-zone--active'); this.handleFile(e.dataTransfer!.files[0]); });
    this.fileInput.addEventListener('change', () => { if (this.fileInput.files?.[0]) this.handleFile(this.fileInput.files[0]); });

    this.formatSelect.addEventListener('change', () => {
      this.qualityGroup.style.display = this.formatSelect.value === 'image/png' ? 'none' : '';
      this.convert();
    });

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
      this.convert();
    });

    root.querySelector('#imgcv-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imgcv-reset')!.addEventListener('click', () => this.reset());
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
      this.showUI();
      this.convert();
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

  private convert(): void {
    if (!this.originalImage) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;

    const { width, height } = this.getScaledSize(this.originalImage.width, this.originalImage.height, 500);
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d')!;

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(this.originalImage, 0, 0, width, height);

    this.canvas.toBlob((blob) => {
      if (!blob) return;
      const ext = format === 'image/png' ? 'PNG' : format === 'image/webp' ? 'WebP' : 'JPEG';
      this.sizeEl.textContent = `${ext} — ${this.formatBytes(blob.size)}`;
    }, format, quality);
  }

  private download(): void {
    if (!this.originalImage) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const w = this.originalImage.width;
    const h = this.originalImage.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(this.originalImage, 0, 0, w, h);

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const name = this.originalFile!.name.replace(/\.[^.]+$/, '') + `.${ext}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.success('Downloaded');
    }, format, quality);
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

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  destroy(): void {}
}
