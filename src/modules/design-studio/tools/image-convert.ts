import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { loadImage, canvasToBlob, downloadBlob, downloadZip, createMultiDropZone, bindClipboardPaste, getExtFromMime, formatBytes } from '../../../utils/image';

interface ConvertedFile { name: string; blob: Blob; }

const FORMATS = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/avif', label: 'AVIF' },
  { value: 'image/gif', label: 'GIF → Static' },
  { value: 'image/svg+xml', label: 'SVG → PNG' },
  { value: 'image/x-icon', label: 'ICO' },
] as const;

export class ImageConvert {
  id = 'image-convert';
  name = 'Image Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
      <path d="M12 11v6M9 14l3 3 3-3"/>
    </svg>`;

  private files: File[] = [];
  private dropZone!: HTMLDivElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private formatSelect!: HTMLSelectElement;
  private qualityGroup!: HTMLDivElement;
  private qualitySlider!: HTMLInputElement;
  private qualityVal!: HTMLSpanElement;
  private canvas!: HTMLCanvasElement;
  private sizeEl!: HTMLSpanElement;
  private fileListEl!: HTMLDivElement;
  private currentImage: HTMLImageElement | null = null;
  private avifSupported = false;
  private cleanupPaste!: () => void;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imgcv-dropzone"></div>
        <div class="imgc-controls" id="imgcv-controls" style="display:none;">
          <div class="form-group">
            <label class="label">Convert to</label>
            <select class="input" id="imgcv-format" style="width:auto;">
              ${FORMATS.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="imgcv-quality-group">
            <label class="label">Quality: <span id="imgcv-quality-val">85</span>%</label>
            <input type="range" id="imgcv-quality" min="1" max="100" value="85" class="password-slider">
          </div>
        </div>
        <div class="imgc-batch-list" id="imgcv-batch" style="display:none;"></div>
        <div class="imgc-preview" id="imgcv-preview" style="display:none;">
          <div class="imgc-preview__item" style="max-width:100%;">
            <label class="label">Preview</label>
            <canvas id="imgcv-canvas" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="imgcv-size">—</span>
          </div>
        </div>
        <div class="tool-actions" id="imgcv-actions" style="display:none;">
          <button class="btn btn--primary" id="imgcv-download">Download</button>
          <button class="btn btn--primary" id="imgcv-download-all" style="display:none;">Download All (ZIP)</button>
          <button class="btn btn--ghost" id="imgcv-reset">Reset</button>
        </div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.dropZone = createMultiDropZone({
      id: 'imgcv-dropzone',
      hint: 'Supports PNG, JPEG, WebP, GIF, SVG — drop multiple for batch',
      onFiles: (files) => this.handleFiles(files),
    });
    root.querySelector('#imgcv-dropzone')!.replaceWith(this.dropZone);

    this.controlsEl = root.querySelector('#imgcv-controls')!;
    this.previewEl = root.querySelector('#imgcv-preview')!;
    this.actionsEl = root.querySelector('#imgcv-actions')!;
    this.formatSelect = root.querySelector('#imgcv-format')!;
    this.qualityGroup = root.querySelector('#imgcv-quality-group')!;
    this.qualitySlider = root.querySelector('#imgcv-quality')!;
    this.qualityVal = root.querySelector('#imgcv-quality-val')!;
    this.canvas = root.querySelector('#imgcv-canvas')!;
    this.sizeEl = root.querySelector('#imgcv-size')!;
    this.fileListEl = root.querySelector('#imgcv-batch')!;

    // Detect AVIF support
    this.avifSupported = await this.detectAvif();

    if (!this.avifSupported) {
      const avifOpt = this.formatSelect.querySelector('option[value="image/avif"]') as HTMLOptionElement;
      if (avifOpt) avifOpt.disabled = true;
    }

    this.formatSelect.addEventListener('change', () => {
      const fmt = this.formatSelect.value;
      this.qualityGroup.style.display = fmt === 'image/png' || fmt === 'image/x-icon' ? 'none' : '';
      if (this.files.length === 1) this.convertSingle();
    });

    this.qualitySlider.addEventListener('input', () => {
      this.qualityVal.textContent = this.qualitySlider.value;
      if (this.files.length === 1) this.convertSingle();
    });

    root.querySelector('#imgcv-download')!.addEventListener('click', () => this.downloadSingle());
    root.querySelector('#imgcv-download-all')!.addEventListener('click', () => this.downloadAll());
    root.querySelector('#imgcv-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFiles([file]));
  }

  private async detectAvif(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const blob = await canvasToBlob(canvas, 'image/avif');
      return blob.size > 0;
    } catch { return false; }
  }

  private handleFiles(files: File[]): void {
    const images = files.filter(f => f.type.startsWith('image/') || f.name.endsWith('.svg'));
    if (!images.length) { Toast.error('No image files found'); return; }
    this.files = images;
    this.showUI();
    if (images.length === 1) {
      this.fileListEl.style.display = 'none';
      this.previewEl.style.display = '';
      this.convertSingle();
    } else {
      this.previewEl.style.display = 'none';
      this.fileListEl.style.display = '';
      this.renderFileList();
    }
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.controlsEl.style.display = '';
    this.actionsEl.style.display = '';
    const dlAll = this.actionsEl.querySelector('#imgcv-download-all') as HTMLElement;
    dlAll.style.display = this.files.length > 1 ? '' : 'none';
    (this.actionsEl.querySelector('#imgcv-download') as HTMLElement).style.display = this.files.length === 1 ? '' : 'none';
  }

  private renderFileList(): void {
    this.fileListEl.innerHTML = `
      <div class="imgc-batch-header"><span>${this.files.length} files</span></div>
      ${this.files.map((f, i) => `
        <div class="imgc-batch-item">
          <span class="imgc-batch-item__name">${f.name}</span>
          <span class="imgc-batch-item__size">${formatBytes(f.size)}</span>
          <span class="imgc-batch-item__status" id="imgcv-status-${i}">pending</span>
        </div>
      `).join('')}
    `;
  }

  private async convertSingle(): Promise<void> {
    if (!this.files[0]) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;

    const img = await loadImage(this.files[0]);
    this.currentImage = img;

    if (format === 'image/svg+xml') {
      this.sizeEl.textContent = 'SVG → PNG conversion';
    }

    const max = 500;
    const ratio = Math.min(max / img.width, max / img.height, 1);
    this.canvas.width = Math.round(img.width * ratio);
    this.canvas.height = Math.round(img.height * ratio);
    const ctx = this.canvas.getContext('2d')!;

    if (format === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

    const outFormat = format === 'image/svg+xml' || format === 'image/gif' ? 'image/png' : format === 'image/x-icon' ? 'image/png' : format as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
    const blob = await canvasToBlob(this.canvas, outFormat, quality);
    const label = FORMATS.find(f => f.value === format)?.label || format;
    this.sizeEl.textContent = `${label} — ${formatBytes(blob.size)}`;
  }

  private async downloadSingle(): Promise<void> {
    if (!this.files[0] || !this.currentImage) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const img = this.currentImage;

    if (format === 'image/x-icon') {
      const blob = await this.buildIco(img);
      downloadBlob(blob, this.files[0].name.replace(/\.[^.]+$/, '') + '.ico');
      Toast.success('ICO downloaded');
      logToolAction('image-convert', 'Downloaded converted ICO');
      return;
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const ctx = offscreen.getContext('2d')!;
    if (format === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, offscreen.width, offscreen.height); }
    ctx.drawImage(img, 0, 0);

    const outFormat = format === 'image/svg+xml' || format === 'image/gif' ? 'image/png' : format as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
    const blob = await canvasToBlob(offscreen, outFormat, quality);
    const ext = format === 'image/svg+xml' || format === 'image/gif' ? 'png' : getExtFromMime(format);
    downloadBlob(blob, this.files[0].name.replace(/\.[^.]+$/, '') + `.${ext}`);
    Toast.success('Downloaded');
    logToolAction('image-convert', 'Downloaded converted image');
  }

  private async downloadAll(): Promise<void> {
    if (this.files.length < 2) return;
    const format = this.formatSelect.value;
    const quality = parseInt(this.qualitySlider.value) / 100;
    const outFormat = format === 'image/svg+xml' || format === 'image/gif' || format === 'image/x-icon' ? 'image/png' : format as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
    const ext = format === 'image/svg+xml' || format === 'image/gif' ? 'png' : format === 'image/x-icon' ? 'ico' : getExtFromMime(format);

    const results: Array<{ name: string; data: Blob }> = [];
    for (let i = 0; i < this.files.length; i++) {
      const statusEl = document.getElementById(`imgcv-status-${i}`);
      if (statusEl) statusEl.textContent = 'processing...';
      try {
        const img = await loadImage(this.files[i]);
        if (format === 'image/x-icon') {
          const blob = await this.buildIco(img);
          results.push({ name: this.files[i].name.replace(/\.[^.]+$/, '.ico'), data: blob });
        } else {
          const offscreen = document.createElement('canvas');
          offscreen.width = img.naturalWidth; offscreen.height = img.naturalHeight;
          const ctx = offscreen.getContext('2d')!;
          if (format === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, offscreen.width, offscreen.height); }
          ctx.drawImage(img, 0, 0);
          const blob = await canvasToBlob(offscreen, outFormat, quality);
          results.push({ name: this.files[i].name.replace(/\.[^.]+$/, `.${ext}`), data: blob });
        }
        if (statusEl) statusEl.textContent = '✓';
      } catch {
        if (statusEl) statusEl.textContent = '✗ error';
      }
    }
    await downloadZip(results, 'converted-images.zip');
    Toast.success(`Downloaded ${results.length} files as ZIP`);
    logToolAction('image-convert', `Downloaded ${results.length} converted images as ZIP`);
  }

  private async buildIco(img: HTMLImageElement): Promise<Blob> {
    const sizes = [16, 32, 48];
    const images: Uint8Array[] = [];

    for (const size of sizes) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d')!.drawImage(img, 0, 0, size, size);
      const imageData = c.getContext('2d')!.getImageData(0, 0, size, size);
      // BMP BGRA bottom-up
      const bgra = new Uint8Array(size * size * 4);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const srcIdx = (y * size + x) * 4;
          const dstIdx = ((size - 1 - y) * size + x) * 4;
          bgra[dstIdx] = imageData.data[srcIdx + 2];     // B
          bgra[dstIdx + 1] = imageData.data[srcIdx + 1]; // G
          bgra[dstIdx + 2] = imageData.data[srcIdx];     // R
          bgra[dstIdx + 3] = imageData.data[srcIdx + 3]; // A
        }
      }
      // BMP info header (40 bytes)
      const header = new ArrayBuffer(40);
      const dv = new DataView(header);
      dv.setUint32(0, 40, true);           // header size
      dv.setInt32(4, size, true);           // width
      dv.setInt32(8, size * 2, true);       // height (doubled for ICO)
      dv.setUint16(12, 1, true);            // planes
      dv.setUint16(14, 32, true);           // bpp
      const combined = new Uint8Array(40 + bgra.length);
      combined.set(new Uint8Array(header), 0);
      combined.set(bgra, 40);
      images.push(combined);
    }

    // ICO header: 6 bytes
    const dirSize = 6 + sizes.length * 16;
    const totalSize = dirSize + images.reduce((s, img) => s + img.length, 0);
    const ico = new Uint8Array(totalSize);
    const dv = new DataView(ico.buffer);
    dv.setUint16(0, 0, true);              // reserved
    dv.setUint16(2, 1, true);              // type: ICO
    dv.setUint16(4, sizes.length, true);   // count

    let offset = dirSize;
    for (let i = 0; i < sizes.length; i++) {
      const dirOffset = 6 + i * 16;
      ico[dirOffset] = sizes[i] === 256 ? 0 : sizes[i];     // width
      ico[dirOffset + 1] = sizes[i] === 256 ? 0 : sizes[i]; // height
      ico[dirOffset + 2] = 0;             // colors
      ico[dirOffset + 3] = 0;             // reserved
      dv.setUint16(dirOffset + 4, 1, true); // planes
      dv.setUint16(dirOffset + 6, 32, true);// bpp
      dv.setUint32(dirOffset + 8, images[i].length, true);  // size
      dv.setUint32(dirOffset + 12, offset, true);            // offset
      ico.set(images[i], offset);
      offset += images[i].length;
    }

    return new Blob([ico], { type: 'image/x-icon' });
  }

  private reset(): void {
    this.files = [];
    this.currentImage = null;
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
