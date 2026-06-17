import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob, downloadZip } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export class PdfSplit {
  id = 'pdf-split';
  name = 'PDF Splitter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`;

  private file: File | null = null;
  private pdfDoc: PDFDocument | null = null;
  private pdfBytes: ArrayBuffer | null = null;
  private pageCount = 0;
  private selectedPages = new Set<number>();
  private containerEl!: HTMLDivElement;
  private thumbsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewLabel!: HTMLSpanElement;
  private rangeInput!: HTMLInputElement;
  private extractBtn!: HTMLButtonElement;
  private splitAllBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfs-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-split-controls" id="pdfs-controls" style="display:none;">
          <div class="pdf-split-info">
            <span id="pdfs-info"></span>
          </div>
          <div class="pdf-split-range">
            <label class="label">Page Range (e.g. 2-5, 8, 10-12)</label>
            <input type="text" class="input" id="pdfs-range" placeholder="Enter page range...">
          </div>
          <div class="pdf-split-preview" id="pdfs-preview" style="display:none;">
            <label class="label" id="pdfs-preview-label">Page 1</label>
            <canvas id="pdfs-preview-canvas"></canvas>
          </div>
          <div class="pdf-split-thumbs" id="pdfs-thumbs"></div>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfs-extract" disabled>Extract Selected Pages</button>
            <button class="btn btn--ghost" id="pdfs-split-all">Split All Pages (ZIP)</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfs-dropzone')!;
    this.containerEl = root.querySelector('#pdfs-controls')!;
    this.thumbsEl = root.querySelector('#pdfs-thumbs')!;
    this.previewEl = root.querySelector('#pdfs-preview')!;
    this.previewCanvas = root.querySelector('#pdfs-preview-canvas')!;
    this.previewLabel = root.querySelector('#pdfs-preview-label')!;
    this.rangeInput = root.querySelector('#pdfs-range')!;
    this.extractBtn = root.querySelector('#pdfs-extract')!;
    this.splitAllBtn = root.querySelector('#pdfs-split-all')!;
    const fileInput = dropZone.querySelector('input')!;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('pdf-drop-zone--active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('pdf-drop-zone--active'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('pdf-drop-zone--active');
      const file = e.dataTransfer?.files[0];
      if (file?.type === 'application/pdf') await this.loadFile(file);
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) await this.loadFile(file);
      fileInput.value = '';
    });

    this.rangeInput.addEventListener('input', () => this.parseRange());
    this.extractBtn.addEventListener('click', () => this.extractSelected());
    this.splitAllBtn.addEventListener('click', () => this.splitAll());
  }

  private async loadFile(file: File): Promise<void> {
    try {
      this.file = file;
      this.pdfBytes = await file.arrayBuffer();
      this.pdfDoc = await PDFDocument.load(this.pdfBytes, { ignoreEncryption: true });
      this.pageCount = this.pdfDoc.getPageCount();
      this.selectedPages.clear();

      (this.containerEl.parentElement?.querySelector('#pdfs-dropzone') as HTMLElement)!.style.display = 'none';
      this.containerEl.style.display = '';

      const infoEl = this.containerEl.querySelector('#pdfs-info')!;
      infoEl.textContent = `${file.name} · ${this.pageCount} pages · ${formatBytes(file.size)}`;

      await this.renderThumbs(this.pdfBytes);
    } catch {
      Toast.error('Failed to load PDF');
    }
  }

  private async renderThumbs(pdfBytes: ArrayBuffer): Promise<void> {
    this.thumbsEl.innerHTML = '';
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

    for (let i = 1; i <= this.pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = 'pdf-thumb-canvas';
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-thumb';
      wrapper.dataset.page = String(i);
      wrapper.innerHTML = `<span class="pdf-thumb-label">${i}</span>`;
      wrapper.prepend(canvas);

      wrapper.addEventListener('click', () => {
        if (this.selectedPages.has(i)) {
          this.selectedPages.delete(i);
          wrapper.classList.remove('pdf-thumb--selected');
        } else {
          this.selectedPages.add(i);
          wrapper.classList.add('pdf-thumb--selected');
        }
        this.extractBtn.disabled = this.selectedPages.size === 0;
        this.renderPagePreview(i);
      });

      this.thumbsEl.appendChild(wrapper);
    }
  }

  private async renderPagePreview(pageNum: number): Promise<void> {
    if (!this.pdfBytes) return;
    try {
      const pdf = await pdfjsLib.getDocument({ data: this.pdfBytes.slice(0) }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });
      this.previewCanvas.width = viewport.width;
      this.previewCanvas.height = viewport.height;
      await page.render({ canvasContext: this.previewCanvas.getContext('2d')!, viewport }).promise;
      this.previewLabel.textContent = `Page ${pageNum}`;
      this.previewEl.style.display = '';
    } catch {
      this.previewEl.style.display = 'none';
    }
  }

  private parseRange(): void {
    this.selectedPages.clear();
    const raw = this.rangeInput.value.trim();
    if (!raw) {
      this.thumbsEl.querySelectorAll('.pdf-thumb').forEach(el => el.classList.remove('pdf-thumb--selected'));
      this.extractBtn.disabled = true;
      return;
    }

    const parts = raw.split(',').map(s => s.trim());
    for (const part of parts) {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (match) {
        const start = Math.max(1, parseInt(match[1]));
        const end = Math.min(this.pageCount, parseInt(match[2]));
        for (let i = start; i <= end; i++) this.selectedPages.add(i);
      } else {
        const num = parseInt(part);
        if (num >= 1 && num <= this.pageCount) this.selectedPages.add(num);
      }
    }

    this.thumbsEl.querySelectorAll('.pdf-thumb').forEach(el => {
      const page = parseInt(el.getAttribute('data-page')!);
      el.classList.toggle('pdf-thumb--selected', this.selectedPages.has(page));
    });

    this.extractBtn.disabled = this.selectedPages.size === 0;
  }

  private async extractSelected(): Promise<void> {
    if (!this.pdfDoc || this.selectedPages.size === 0) return;
    this.extractBtn.disabled = true;
    this.extractBtn.textContent = 'Extracting...';

    try {
      const newPdf = await PDFDocument.create();
      const indices = Array.from(this.selectedPages).sort((a, b) => a - b).map(p => p - 1);
      const pages = await newPdf.copyPages(this.pdfDoc, indices);
      pages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, `extracted-pages.pdf`);
      Toast.success(`Extracted ${this.selectedPages.size} pages`);
      logToolAction('pdf-split', 'Extracted PDF pages');
    } catch {
      Toast.error('Failed to extract pages');
    }

    this.extractBtn.textContent = 'Extract Selected Pages';
    this.extractBtn.disabled = false;
  }

  private async splitAll(): Promise<void> {
    if (!this.pdfDoc) return;
    this.splitAllBtn.disabled = true;
    this.splitAllBtn.textContent = 'Splitting...';

    try {
      const files: Array<{ name: string; data: Blob }> = [];
      for (let i = 0; i < this.pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(this.pdfDoc, [i]);
        newPdf.addPage(page);
        const pdfBytes = await newPdf.save();
        files.push({ name: `page-${i + 1}.pdf`, data: new Blob([pdfBytes], { type: 'application/pdf' }) });
      }

      await downloadZip(files, 'split-pages.zip');
      Toast.success(`Split into ${this.pageCount} pages`);
      logToolAction('pdf-split', 'Split PDF into pages');
    } catch {
      Toast.error('Failed to split PDF');
    }

    this.splitAllBtn.textContent = 'Split All Pages (ZIP)';
    this.splitAllBtn.disabled = false;
  }

  destroy(): void {}
}
