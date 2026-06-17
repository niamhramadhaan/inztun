import exifr from 'exifr';
import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { loadImage, canvasToBlob, downloadBlob, createDropZone, bindClipboardPaste, formatBytes, getExtFromMime } from '../../../utils/image';

export class ImageMetadata {
  id = 'image-metadata';
  name = 'Image Metadata';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
      <line x1="7" y1="17" x2="17" y2="17"/><line x1="7" y1="20" x2="13" y2="20"/>
    </svg>`;

  private dropZone!: HTMLDivElement;
  private metaEl!: HTMLDivElement;
  private actionsEl!: HTMLDivElement;
  private formatSelect!: HTMLSelectElement;
  private currentFile: File | null = null;
  private currentImage: HTMLImageElement | null = null;
  private metadata: Record<string, unknown> | null = null;
  private gps: { latitude: number; longitude: number } | null = null;
  private cleanupPaste!: () => void;

  render(): string {
    return `
      <div class="tool-area">
        <div id="imgm-dropzone"></div>
        <div class="imgm-meta" id="imgm-meta" style="display:none;"></div>
        <div class="imgm-actions" id="imgm-actions" style="display:none;">
          <div class="form-group">
            <label class="label">Export Format</label>
            <select class="input" id="imgm-format" style="width:auto;">
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div class="tool-actions">
            <button class="btn btn--primary" id="imgm-strip">Strip & Download</button>
            <button class="btn btn--ghost" id="imgm-copy-json">Copy JSON</button>
            <button class="btn btn--ghost" id="imgm-reset">Reset</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = createDropZone({
      id: 'imgm-dropzone',
      hint: 'Supports JPEG, PNG, WebP, TIFF — reads EXIF, IPTC, GPS',
      onFile: (file) => this.handleFile(file),
    });
    root.querySelector('#imgm-dropzone')!.replaceWith(this.dropZone);

    this.metaEl = root.querySelector('#imgm-meta')!;
    this.actionsEl = root.querySelector('#imgm-actions')!;
    this.formatSelect = root.querySelector('#imgm-format')!;

    root.querySelector('#imgm-strip')!.addEventListener('click', () => this.stripAndDownload());
    root.querySelector('#imgm-copy-json')!.addEventListener('click', () => this.copyJson());
    root.querySelector('#imgm-reset')!.addEventListener('click', () => this.reset());

    this.cleanupPaste = bindClipboardPaste((file) => this.handleFile(file));
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) { Toast.error('Not an image file'); return; }
    this.currentFile = file;
    this.currentImage = await loadImage(file);

    // Parse metadata
    try {
      this.metadata = await exifr.parse(file, true) as Record<string, unknown> | null;
      this.gps = await exifr.gps(file) as { latitude: number; longitude: number } | null;
    } catch {
      this.metadata = null;
      this.gps = null;
      Toast.info('No readable metadata found');
    }

    this.showUI();
    this.renderMetadata();
  }

  private showUI(): void {
    this.dropZone.style.display = 'none';
    this.metaEl.style.display = '';
    this.actionsEl.style.display = '';
  }

  private renderMetadata(): void {
    const m = this.metadata || {};
    const img = this.currentImage!;
    const file = this.currentFile!;

    const rows: Array<[string, string]> = [];

    // Basic
    rows.push(['File Name', file.name]);
    rows.push(['File Size', formatBytes(file.size)]);
    rows.push(['MIME Type', file.type || 'unknown']);
    rows.push(['Dimensions', `${img.naturalWidth} × ${img.naturalHeight} px`]);

    // EXIF camera
    if (m.Make) rows.push(['Camera Make', String(m.Make)]);
    if (m.Model) rows.push(['Camera Model', String(m.Model)]);
    if (m.LensModel) rows.push(['Lens', String(m.LensModel)]);
    if (m.FocalLength) rows.push(['Focal Length', `${m.FocalLength}mm`]);
    if (m.FNumber) rows.push(['Aperture', `f/${m.FNumber}`]);
    if (m.ISO) rows.push(['ISO', String(m.ISO)]);
    if (m.ExposureTime) rows.push(['Shutter Speed', this.formatExposure(m.ExposureTime as number)]);
    if (m.DateTimeOriginal) rows.push(['Date Taken', String(m.DateTimeOriginal)]);
    if (m.Software) rows.push(['Software', String(m.Software)]);

    // Color
    if (m.ColorSpace) rows.push(['Color Space', String(m.ColorSpace)]);
    if (m.Orientation) rows.push(['Orientation', String(m.Orientation)]);

    // GPS
    if (this.gps) {
      rows.push(['GPS Latitude', this.gps.latitude.toFixed(6)]);
      rows.push(['GPS Longitude', this.gps.longitude.toFixed(6)]);
    }

    this.metaEl.innerHTML = `
      <div class="imgm-table">
        ${rows.map(([key, val]) => `
          <div class="imgm-row">
            <span class="imgm-row__key">${key}</span>
            <span class="imgm-row__val">${val}</span>
          </div>
        `).join('')}
        ${this.gps ? `
          <div class="imgm-row">
            <span class="imgm-row__key">Map</span>
            <span class="imgm-row__val">
              <a href="https://www.openstreetmap.org/?mlat=${this.gps.latitude}&mlon=${this.gps.longitude}#map=15/${this.gps.latitude}/${this.gps.longitude}" target="_blank" rel="noopener" class="imgm-link">View on OpenStreetMap</a>
            </span>
          </div>
        ` : ''}
      </div>
      ${!this.metadata ? '<p class="imgm-empty">No EXIF metadata found in this image.</p>' : ''}
    `;
  }

  private formatExposure(time: number): string {
    if (time >= 1) return `${time}s`;
    return `1/${Math.round(1 / time)}s`;
  }

  private async stripAndDownload(): Promise<void> {
    if (!this.currentImage) return;
    const format = this.formatSelect.value;
    const quality = format === 'image/png' ? undefined : 90;

    // Canvas redraw strips EXIF
    const canvas = document.createElement('canvas');
    canvas.width = this.currentImage.naturalWidth;
    canvas.height = this.currentImage.naturalHeight;
    canvas.getContext('2d')!.drawImage(this.currentImage, 0, 0);

    const blob = await canvasToBlob(canvas, format, quality ? quality / 100 : undefined);
    const ext = getExtFromMime(format);
    downloadBlob(blob, this.currentFile!.name.replace(/\.[^.]+$/, '') + `-stripped.${ext}`);
    Toast.success('Metadata stripped & downloaded');
    logToolAction('image-metadata', 'Stripped metadata & downloaded');
  }

  private copyJson(): void {
    const json = JSON.stringify(this.metadata || {}, null, 2);
    navigator.clipboard.writeText(json);
    Toast.copied('Metadata JSON');
    logToolAction('image-metadata', 'Copied metadata JSON');
  }

  private reset(): void {
    this.currentFile = null;
    this.currentImage = null;
    this.metadata = null;
    this.gps = null;
    this.dropZone.style.display = '';
    this.metaEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
  }

  destroy(): void {
    this.cleanupPaste?.();
  }
}
