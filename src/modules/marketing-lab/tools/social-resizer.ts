import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { downloadBlob, formatBytes, loadImage } from '../../../utils/image';

const PRESETS = [
  { name: 'Twitter Post', w: 1600, h: 900, platform: 'Twitter' },
  { name: 'Twitter Header', w: 1500, h: 500, platform: 'Twitter' },
  { name: 'Twitter Profile', w: 400, h: 400, platform: 'Twitter' },
  { name: 'Instagram Post', w: 1080, h: 1080, platform: 'Instagram' },
  { name: 'Instagram Story', w: 1080, h: 1920, platform: 'Instagram' },
  { name: 'Instagram Profile', w: 320, h: 320, platform: 'Instagram' },
  { name: 'LinkedIn Post', w: 1200, h: 627, platform: 'LinkedIn' },
  { name: 'LinkedIn Banner', w: 1584, h: 396, platform: 'LinkedIn' },
  { name: 'Facebook Cover', w: 820, h: 312, platform: 'Facebook' },
  { name: 'Facebook Post', w: 1200, h: 630, platform: 'Facebook' },
];

export class SocialResizer {
  id = 'social-resizer';
  name = 'Social Media Resizer';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 3v18M3 9h18"/>
      <path d="M15 15l4 4M15 19l4-4"/>
    </svg>`;
  badge = 'Social';

  private dropZone!: HTMLDivElement;
  private fileInput!: HTMLInputElement;
  private controlsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private presetSelect!: HTMLSelectElement;
  private sizeInfoEl!: HTMLSpanElement;
  private sourceImage: HTMLImageElement | null = null;
  private originalFile: File | null = null;

  render(): string {
    return `
      <div class="tool-area">
        <div class="imgc-drop-zone" id="sr-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Drop an image here or <strong>click to browse</strong></p>
          <span class="imgc-drop-zone__hint">Image will be center-cropped to fit</span>
          <input type="file" id="sr-file" accept="image/*" hidden>
        </div>
        <div class="imgc-controls" id="sr-controls" style="display:none;">
          <div class="form-group" style="flex:1;">
            <label class="label">Platform Preset</label>
            <select class="input" id="sr-preset">
              ${PRESETS.map((p, i) => `<option value="${i}" ${i === 0 ? 'selected' : ''}>${p.name} (${p.w}×${p.h})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="imgc-preview" id="sr-preview" style="display:none;">
          <div class="imgc-preview__item" style="max-width:100%;">
            <label class="label">Preview</label>
            <canvas id="sr-canvas" class="imgc-canvas"></canvas>
            <span class="imgc-size" id="sr-size">—</span>
          </div>
        </div>
        <div class="tool-actions" id="sr-actions" style="display:none;">
          <button class="btn btn--primary" id="sr-download">Download</button>
          <button class="btn btn--ghost" id="sr-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#sr-dropzone')!;
    this.fileInput = root.querySelector('#sr-file')!;
    this.controlsEl = root.querySelector('#sr-controls')!;
    this.previewEl = root.querySelector('#sr-preview')!;
    this.actionsEl = root.querySelector('#sr-actions')!;
    this.canvas = root.querySelector('#sr-canvas')!;
    this.presetSelect = root.querySelector('#sr-preset')!;
    this.sizeInfoEl = root.querySelector('#sr-size')!;

    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('imgc-drop-zone--active');
    });
    this.dropZone.addEventListener('dragleave', () =>
      this.dropZone.classList.remove('imgc-drop-zone--active'),
    );
    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('imgc-drop-zone--active');
      if (e.dataTransfer?.files[0]) this.handleFile(e.dataTransfer.files[0]);
    });
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files?.[0]) this.handleFile(this.fileInput.files[0]);
    });
    this.presetSelect.addEventListener('change', () => this.resize());

    root.querySelector('#sr-download')!.addEventListener('click', () => this.download());
    root.querySelector('#sr-reset')!.addEventListener('click', () => this.reset());
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image');
      return;
    }
    try {
      this.sourceImage = await loadImage(file);
      this.originalFile = file;
      this.dropZone.style.display = 'none';
      this.controlsEl.style.display = '';
      this.previewEl.style.display = '';
      this.actionsEl.style.display = '';
      this.resize();
    } catch {
      Toast.error('Failed to load image');
    }
  }

  private resize(): void {
    if (!this.sourceImage) return;
    const idx = parseInt(this.presetSelect.value);
    const preset = PRESETS[idx];
    const { w, h } = { w: preset.w, h: preset.h };

    const scale = Math.max(w / this.sourceImage.width, h / this.sourceImage.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (this.sourceImage.width - sw) / 2;
    const sy = (this.sourceImage.height - sh) / 2;

    const maxDisplay = 500;
    const displayRatio = Math.min(maxDisplay / w, maxDisplay / h, 1);
    const dw = Math.round(w * displayRatio);
    const dh = Math.round(h * displayRatio);

    this.canvas.width = dw;
    this.canvas.height = dh;
    const ctx = this.canvas.getContext('2d')!;
    ctx.drawImage(this.sourceImage, sx, sy, sw, sh, 0, 0, dw, dh);
    this.sizeInfoEl.textContent = `${preset.name} — ${w} × ${h} px`;
  }

  private download(): void {
    if (!this.sourceImage) return;
    const idx = parseInt(this.presetSelect.value);
    const preset = PRESETS[idx];

    const scale = Math.max(preset.w / this.sourceImage.width, preset.h / this.sourceImage.height);
    const sw = preset.w / scale;
    const sh = preset.h / scale;
    const sx = (this.sourceImage.width - sw) / 2;
    const sy = (this.sourceImage.height - sh) / 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = preset.w;
    offscreen.height = preset.h;
    offscreen
      .getContext('2d')!
      .drawImage(this.sourceImage, sx, sy, sw, sh, 0, 0, preset.w, preset.h);

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const name =
        this.originalFile!.name.replace(/\.[^.]+$/, '') +
        `-${preset.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      downloadBlob(blob, name);
      Toast.success('Downloaded');
      logToolAction('social-resizer', 'Downloaded resized image');
    }, 'image/png');
  }

  private reset(): void {
    this.sourceImage = null;
    this.originalFile = null;
    this.dropZone.style.display = '';
    this.controlsEl.style.display = 'none';
    this.previewEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.fileInput.value = '';
  }

  destroy(): void {}
}
