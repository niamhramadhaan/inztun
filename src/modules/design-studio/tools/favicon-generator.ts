import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { downloadBlob, loadImage } from '../../../utils/image';

const FAVICON_SIZES = [
  { size: 16, label: '16×16', desc: 'Browser tab' },
  { size: 32, label: '32×32', desc: 'Favicon' },
  { size: 48, label: '48×48', desc: 'Site icon' },
  { size: 180, label: '180×180', desc: 'Apple Touch' },
  { size: 192, label: '192×192', desc: 'Android Chrome' },
  { size: 512, label: '512×512', desc: 'PWA Icon' },
];

export class FaviconGenerator {
  id = 'favicon-generator';
  name = 'Favicon Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private fileInput!: HTMLInputElement;
  private previewGrid!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private sourceImage: HTMLImageElement | null = null;
  private canvases: Map<number, HTMLCanvasElement> = new Map();

  render(): string {
    return `
      <div class="tool-area">
        <div class="imgc-drop-zone" id="fav-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p>Drop an image here or <strong>click to browse</strong></p>
          <span class="imgc-drop-zone__hint">Square images work best</span>
          <input type="file" id="fav-file" accept="image/*" hidden>
        </div>
        <div class="fav-grid" id="fav-grid" style="display:none;"></div>
        <div class="tool-actions" id="fav-actions" style="display:none;">
          <button class="btn btn--ghost" id="fav-reset">Reset</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#fav-dropzone')!;
    this.fileInput = root.querySelector('#fav-file')!;
    this.previewGrid = root.querySelector('#fav-grid')!;
    this.actionsEl = root.querySelector('#fav-actions')!;

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

    root.querySelector('#fav-reset')!.addEventListener('click', () => this.reset());
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      Toast.error('Not an image');
      return;
    }
    try {
      this.sourceImage = await loadImage(file);
      this.dropZone.style.display = 'none';
      this.previewGrid.style.display = '';
      this.actionsEl.style.display = '';
      this.renderPreviews();
    } catch {
      Toast.error('Failed to load image');
    }
  }

  private renderPreviews(): void {
    if (!this.sourceImage) return;
    this.previewGrid.innerHTML = '';
    this.canvases.clear();

    FAVICON_SIZES.forEach(({ size, label, desc }) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(this.sourceImage!, 0, 0, size, size);
      this.canvases.set(size, canvas);

      const displaySize = Math.min(size, 96);
      const item = document.createElement('div');
      item.className = 'fav-item';
      item.innerHTML = `
        <canvas class="fav-canvas" width="${displaySize}" height="${displaySize}" style="width:${displaySize}px;height:${displaySize}px;"></canvas>
        <div class="fav-item__info">
          <span class="fav-item__label">${label}</span>
          <span class="fav-item__desc">${desc}</span>
        </div>
        <button class="btn btn--sm btn--ghost fav-download" data-size="${size}">↓</button>
      `;

      const displayCanvas = item.querySelector('canvas')!;
      displayCanvas.getContext('2d')!.drawImage(canvas, 0, 0, displaySize, displaySize);

      item.querySelector('.fav-download')!.addEventListener('click', () => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          downloadBlob(blob, `favicon-${size}x${size}.png`);
          Toast.success(`Downloaded ${label}`);
          logToolAction('favicon-generator', `Downloaded ${label} favicon`);
        }, 'image/png');
      });

      this.previewGrid.appendChild(item);
    });
  }

  private reset(): void {
    this.sourceImage = null;
    this.dropZone.style.display = '';
    this.previewGrid.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.fileInput.value = '';
  }

  destroy(): void {}
}
