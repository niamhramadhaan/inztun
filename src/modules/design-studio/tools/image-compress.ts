import { Toast } from '../../../components/Toast';

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
  private fileInput!: HTMLInputElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;
  private originalSizeEl!: HTMLSpanElement;
  private compressedSizeEl!: HTMLSpanElement;
  private savingsEl!: HTMLSpanElement;
  private originalCanvas!: HTMLCanvasElement;
  private compressedCanvas!: HTMLCanvasElement;
  private originalFile: File | null = null;
  private originalImage: HTMLImageElement | null = null;

  render(): string {
    return `
      <div class="tool-area">
        <div class="imgc-drop-zone" id="imgc-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Drop an image here or <strong>click to browse</strong></p>
          <span class="imgc-drop-zone__hint">Supports PNG, JPEG, WebP, GIF</span>
          <input type="file" id="imgc-file" accept="image/*" hidden>
        </div>
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
          <div class="imgc-savings" id="imgc-savings"></div>
        </div>
        <div class="tool-actions" id="imgc-actions" style="display:none;">
          <button class="btn btn--primary" id="imgc-download">Download</button>
          <button class="btn btn--ghost" id="imgc-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#imgc-dropzone')!;
    this.fileInput = root.querySelector('#imgc-file')!;
    this.controlsEl = root.querySelector('#imgc-controls')!;
    this.previewEl = root.querySelector('#imgc-preview')!;
    this.actionsEl = root.querySelector('#imgc-actions')!;
    this.qualitySlider = root.querySelector('#imgc-quality')!;
    this.qualityVal = root.querySelector('#imgc-quality-val')!;
    this.originalSizeEl = root.querySelector('#imgc-original-size')!;
    this.compressedSizeEl = root.querySelector('#imgc-compressed-size')!;
    this.savingsEl = root.querySelector('#imgc-savings')!;
    this.originalCanvas = root.querySelector('#imgc-original')!;
    this.compressedCanvas = root.querySelector('#imgc-compressed')!;

    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropZone.classList.add('imgc-drop-zone--active'); });
    this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('imgc-drop-zone--active'));
    this.dropZone.addEventListener('drop', (e) => { e.preventDefault(); this.dropZone.classList.remove('imgc-drop-zone--active'); this.handleFile(e.dataTransfer!.files[0]); });
    this.fileInput.addEventListener('change', () => { if (this.fileInput.files?.[0]) this.handleFile(this.fileInput.files[0]); });

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
      this.compress();
    });

    const formatSelect = root.querySelector('#imgc-format') as HTMLSelectElement;
    formatSelect.addEventListener('change', () => this.compress());

    root.querySelector('#imgc-download')!.addEventListener('click', () => this.download());
    root.querySelector('#imgc-reset')!.addEventListener('click', () => this.reset());
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
      this.drawOriginal();
      this.compress();
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

  private drawOriginal(): void {
    if (!this.originalImage) return;
    const { width, height } = this.getScaledSize(this.originalImage.width, this.originalImage.height, 300);
    this.originalCanvas.width = width;
    this.originalCanvas.height = height;
    const ctx = this.originalCanvas.getContext('2d')!;
    ctx.drawImage(this.originalImage, 0, 0, width, height);
    this.originalSizeEl.textContent = this.formatBytes(this.originalFile!.size);
  }

  private compress(): void {
    if (!this.originalImage) return;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const format = (document.querySelector('#imgc-format') as HTMLSelectElement).value as string;

    const { width, height } = this.getScaledSize(this.originalImage.width, this.originalImage.height, 1600);
    this.compressedCanvas.width = width;
    this.compressedCanvas.height = height;
    const ctx = this.compressedCanvas.getContext('2d')!;
    ctx.drawImage(this.originalImage, 0, 0, width, height);

    this.compressedCanvas.toBlob((blob) => {
      if (!blob) return;
      this.compressedSizeEl.textContent = this.formatBytes(blob.size);
      const original = this.originalFile!.size;
      const savings = ((1 - blob.size / original) * 100);
      this.savingsEl.textContent = savings > 0
        ? `${savings.toFixed(1)}% smaller`
        : savings < 0
          ? `${Math.abs(savings).toFixed(1)}% larger (try lower quality)`
          : 'Same size';
      this.savingsEl.className = 'imgc-savings ' + (savings > 0 ? 'imgc-savings--positive' : savings < 0 ? 'imgc-savings--negative' : '');
    }, format, quality);
  }

  private download(): void {
    const quality = parseInt(this.qualitySlider.value) / 100;
    const format = (document.querySelector('#imgc-format') as HTMLSelectElement).value;
    this.compressedCanvas.toBlob((blob) => {
      if (!blob) return;
      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const name = this.originalFile!.name.replace(/\.[^.]+$/, '') + `-compressed.${ext}`;
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
