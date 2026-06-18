import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob, downloadZip, canvasToBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DPI_OPTIONS = [
  { label: '72 DPI (Screen)', value: 72 },
  { label: '96 DPI (Standard)', value: 96 },
  { label: '150 DPI (High)', value: 150 },
  { label: '300 DPI (Print)', value: 300 },
];

export class PdfToImages {
  id = 'pdf-to-images';
  name = 'PDF to Images';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="6" y="12" width="12" height="8" rx="1"/><circle cx="9" cy="15" r="1"/></svg>`;

  private file: File | null = null;
  private pageCount = 0;
  private containerEl!: HTMLDivElement;
  private dpiSelect!: HTMLSelectElement;
  private thumbsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewLabel!: HTMLSpanElement;
  private downloadAllBtn!: HTMLButtonElement;
  private downloadZipBtn!: HTMLButtonElement;
  private canvases: HTMLCanvasElement[] = [];

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfi-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="6" y="12" width="12" height="8" rx="1"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-images-controls" id="pdfi-controls" style="display:none;">
          <div class="pdf-images-header">
            <span id="pdfi-info"></span>
            <button class="btn btn--ghost btn--sm" id="pdfi-change">Change File</button>
            <div class="form-group" style="margin:0;">
              <label class="label">DPI</label>
              <select class="input" id="pdfi-dpi">
                ${DPI_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="pdf-images-preview" id="pdfi-preview" style="display:none;">
            <label class="label" id="pdfi-preview-label">Page 1</label>
            <canvas id="pdfi-preview-canvas"></canvas>
            <span class="pdf-preview-label" id="pdfi-preview-dims"></span>
          </div>
          <div class="pdf-images-thumbs" id="pdfi-thumbs"></div>
          <div class="pdf-actions">
            <button class="btn btn--ghost" id="pdfi-download-all">Download All PNG</button>
            <button class="btn btn--primary" id="pdfi-download-zip">Download as ZIP</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfi-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfi-controls')!;
    this.dpiSelect = root.querySelector('#pdfi-dpi')!;
    this.thumbsEl = root.querySelector('#pdfi-thumbs')!;
    this.previewEl = root.querySelector('#pdfi-preview')!;
    this.previewCanvas = root.querySelector('#pdfi-preview-canvas')!;
    this.previewLabel = root.querySelector('#pdfi-preview-label')!;
    this.downloadAllBtn = root.querySelector('#pdfi-download-all')!;
    this.downloadZipBtn = root.querySelector('#pdfi-download-zip')!;
    const fileInput = dropZone.querySelector('input')!;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('pdf-drop-zone--active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('pdf-drop-zone--active'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('pdf-drop-zone--active');
      const file = e.dataTransfer?.files[0];
      if (file?.type === 'application/pdf') await this.loadFile(file, dropZone);
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) await this.loadFile(file, dropZone);
      fileInput.value = '';
    });

    this.dpiSelect.addEventListener('change', () => {
      if (this.file) {
        this.renderPages();
        this.previewEl.style.display = 'none';
      }
    });

    this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    this.downloadZipBtn.addEventListener('click', () => this.downloadAsZip());

    root.querySelector('#pdfi-change')?.addEventListener('click', () => {
      this.file = null;
      this.pageCount = 0;
      this.canvases = [];
      this.thumbsEl.innerHTML = '';
      this.previewEl.style.display = 'none';
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });

    // Load default DPI
    db.getPreference('defaultDpi', 150).then(val => {
      this.dpiSelect.value = String(val);
    });
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    try {
      this.file = file;
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      this.pageCount = pdf.numPages;

      dropZone.style.display = 'none';
      this.containerEl.style.display = '';

      const infoEl = this.containerEl.querySelector('#pdfi-info')!;
      infoEl.textContent = `${file.name} · ${this.pageCount} pages · ${formatBytes(file.size)}`;

      await this.renderPages();
    } catch {
      Toast.error('Failed to load PDF');
    }
  }

  private async renderPages(): Promise<void> {
    if (!this.file) return;
    this.thumbsEl.innerHTML = '';
    this.canvases = [];

    const bytes = await this.file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const dpi = parseInt(this.dpiSelect.value);
    const scale = dpi / 72; // 72 is base PDF DPI

    const infoEl = this.containerEl.querySelector('#pdfi-info')!;
    const progressToast = this.pageCount > 5 ? Toast.progress('Rendering pages...', 0, this.pageCount) : null;

    for (let i = 1; i <= this.pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      this.canvases.push(canvas);

      if (progressToast) {
        Toast.updateProgress(progressToast, i, this.pageCount);
      }
      infoEl.textContent = `${this.file.name} · Rendering ${i}/${this.pageCount}...`;

      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-image-thumb';
      const displayCanvas = document.createElement('canvas');
      const maxThumbW = 200;
      const ratio = maxThumbW / canvas.width;
      displayCanvas.width = maxThumbW;
      displayCanvas.height = Math.round(canvas.height * ratio);
      displayCanvas.getContext('2d')!.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
      wrapper.innerHTML = `<span class="pdf-image-thumb-label">Page ${i} · ${viewport.width}×${viewport.height}px</span>`;
      wrapper.prepend(displayCanvas);

      // Click to show inline preview
      const pageNum = i;
      wrapper.addEventListener('click', () => {
        this.renderPagePreview(pageNum);
      });

      this.thumbsEl.appendChild(wrapper);
    }

    infoEl.textContent = `${this.file.name} · ${this.pageCount} pages · ${formatBytes(this.file.size)}`;
  }

  private renderPagePreview(pageNum: number): void {
    const canvas = this.canvases[pageNum - 1];
    if (!canvas) return;

    // Draw full-res canvas content into the preview canvas
    this.previewCanvas.width = canvas.width;
    this.previewCanvas.height = canvas.height;
    this.previewCanvas.getContext('2d')!.drawImage(canvas, 0, 0);

    const dimsEl = this.containerEl.querySelector('#pdfi-preview-dims')!;
    this.previewLabel.textContent = `Page ${pageNum}`;
    dimsEl.textContent = `${canvas.width} × ${canvas.height}px · ${this.dpiSelect.options[this.dpiSelect.selectedIndex].label}`;
    this.previewEl.style.display = '';
  }

  private async downloadAll(): Promise<void> {
    for (let i = 0; i < this.canvases.length; i++) {
      const blob = await canvasToBlob(this.canvases[i], 'image/png');
      downloadBlob(blob, `page-${i + 1}.png`);
      await new Promise(r => setTimeout(r, 100)); // stagger downloads
    }
    Toast.success(`Downloaded ${this.canvases.length} images`);
    logToolAction('pdf-to-images', 'Exported PDF pages as images');
  }

  private async downloadAsZip(): Promise<void> {
    const files: Array<{ name: string; data: Blob }> = [];
    for (let i = 0; i < this.canvases.length; i++) {
      const blob = await canvasToBlob(this.canvases[i], 'image/png');
      files.push({ name: `page-${i + 1}.png`, data: blob });
    }
    await downloadZip(files, 'pdf-pages.zip');
    Toast.success(`Downloaded ${files.length} pages as ZIP`);
    logToolAction('pdf-to-images', 'Exported PDF pages as ZIP');
  }

  destroy(): void {}
}
