import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob, downloadZip } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SplitState {
  file: File | null;
  pdfBytes: ArrayBuffer | null;
  pdfDoc: PDFDocument | null;
  pdfDocProxy: PDFDocumentProxy | null;
  pageCount: number;
  selectedPages: Set<number>;
  previewPage: number | null;
  loading: boolean;
}

export class PdfSplit {
  id = 'pdf-split';
  name = 'PDF Splitter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`;

  private state: SplitState = {
    file: null,
    pdfBytes: null,
    pdfDoc: null,
    pdfDocProxy: null,
    pageCount: 0,
    selectedPages: new Set(),
    previewPage: null,
    loading: false,
  };

  private containerEl!: HTMLDivElement;
  private thumbsEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewLabel!: HTMLSpanElement;
  private extractBtn!: HTMLButtonElement;
  private splitAllBtn!: HTMLButtonElement;
  private selectAllBtn!: HTMLButtonElement;
  private clearBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfs-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-split-controls" id="pdfs-controls" style="display:none;">
          <div class="pdf-info-bar">
            <span id="pdfs-info"></span>
            <button class="btn btn--ghost btn--sm" id="pdfs-change">Change File</button>
          </div>
          <div class="pdf-select-actions" id="pdfs-select-actions">
            <button class="btn btn--ghost btn--sm" id="pdfs-select-all">Select All</button>
            <button class="btn btn--ghost btn--sm" id="pdfs-clear">Clear</button>
          </div>
          <div class="pdf-split-thumbs" id="pdfs-thumbs"></div>
          <div class="pdf-split-preview" id="pdfs-preview" style="display:none;">
            <label class="label" id="pdfs-preview-label">Page 1</label>
            <canvas id="pdfs-preview-canvas"></canvas>
          </div>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfs-extract" disabled>Extract Selected Pages</button>
            <button class="btn btn--ghost" id="pdfs-split-all">Split All Pages (ZIP)</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfs-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfs-controls')!;
    this.thumbsEl = root.querySelector('#pdfs-thumbs')!;
    this.previewEl = root.querySelector('#pdfs-preview')!;
    this.previewCanvas = root.querySelector('#pdfs-preview-canvas')!;
    this.previewLabel = root.querySelector('#pdfs-preview-label')!;
    this.extractBtn = root.querySelector('#pdfs-extract')!;
    this.splitAllBtn = root.querySelector('#pdfs-split-all')!;
    this.selectAllBtn = root.querySelector('#pdfs-select-all')!;
    this.clearBtn = root.querySelector('#pdfs-clear')!;
    const fileInput = dropZone.querySelector('input')!;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('pdf-drop-zone--active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('pdf-drop-zone--active'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('pdf-drop-zone--active');
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file?.type === 'application/pdf') await this.loadFile(file, dropZone as HTMLDivElement);
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) await this.loadFile(file, dropZone as HTMLDivElement);
      fileInput.value = '';
    });

    this.extractBtn.addEventListener('click', () => this.extractSelected());
    this.splitAllBtn.addEventListener('click', () => this.splitAll());
    this.selectAllBtn.addEventListener('click', () => this.selectAll());
    this.clearBtn.addEventListener('click', () => this.clearSelection());

    // Change File
    root.querySelector('#pdfs-change')?.addEventListener('click', () => {
      this.cleanupProxy();
      this.state.file = null;
      this.state.pdfBytes = null;
      this.state.pdfDoc = null;
      this.state.selectedPages.clear();
      this.state.previewPage = null;
      this.thumbsEl.innerHTML = '';
      this.previewEl.style.display = 'none';
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.cleanupProxy();

    this.state.file = file;
    this.state.loading = true;
    this.state.selectedPages.clear();
    this.state.previewPage = null;

    try {
      this.state.pdfBytes = await file.arrayBuffer();
      this.state.pdfDoc = await PDFDocument.load(this.state.pdfBytes, { ignoreEncryption: true });
      this.state.pageCount = this.state.pdfDoc.getPageCount();
    } catch {
      Toast.error('Failed to load PDF');
      this.state.loading = false;
      return;
    }

    dropZone.style.display = 'none';
    this.containerEl.style.display = '';

    const infoEl = this.containerEl.querySelector('#pdfs-info')!;
    infoEl.textContent = `${file.name} · ${this.state.pageCount} pages · ${formatBytes(file.size)}`;

    this.previewEl.style.display = 'none';
    this.syncButtons();

    try {
      this.state.pdfDocProxy = await pdfjsLib.getDocument({ data: this.state.pdfBytes.slice(0) }).promise;
      await this.renderThumbs();
    } catch {
      Toast.error('Failed to render page previews');
    }

    this.state.loading = false;
  }

  private async renderThumbs(): Promise<void> {
    this.thumbsEl.innerHTML = '';
    const pdf = this.state.pdfDocProxy;
    if (!pdf) return;

    for (let i = 1; i <= this.state.pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = 'pdf-thumb-canvas';
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-thumb';
      wrapper.dataset.page = String(i);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'pdf-thumb-check';
      checkbox.checked = false;

      const label = document.createElement('span');
      label.className = 'pdf-thumb-label';
      label.textContent = String(i);

      wrapper.appendChild(checkbox);
      wrapper.appendChild(canvas);
      wrapper.appendChild(label);

      wrapper.addEventListener('click', () => this.togglePage(i, wrapper, checkbox));
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePage(i, wrapper, checkbox);
      });

      this.thumbsEl.appendChild(wrapper);
    }
  }

  private togglePage(pageNum: number, wrapper: HTMLDivElement, checkbox: HTMLInputElement): void {
    if (this.state.selectedPages.has(pageNum)) {
      this.state.selectedPages.delete(pageNum);
      wrapper.classList.remove('pdf-thumb--selected');
      checkbox.checked = false;
    } else {
      this.state.selectedPages.add(pageNum);
      wrapper.classList.add('pdf-thumb--selected');
      checkbox.checked = true;
    }
    this.syncButtons();
    this.showPreview(pageNum);
  }

  private showPreview(pageNum: number): void {
    if (this.state.previewPage === pageNum) {
      this.state.previewPage = null;
      this.previewEl.style.display = 'none';
      return;
    }

    this.state.previewPage = pageNum;
    this.renderPagePreview(pageNum);
  }

  private async renderPagePreview(pageNum: number): Promise<void> {
    const pdf = this.state.pdfDocProxy;
    if (!pdf) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });
      const ctx = this.previewCanvas.getContext('2d')!;
      this.previewCanvas.width = viewport.width;
      this.previewCanvas.height = viewport.height;
      ctx.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({ canvas: this.previewCanvas, canvasContext: ctx, viewport }).promise;
      this.previewLabel.textContent = `Page ${pageNum}`;
      this.previewEl.style.display = '';
    } catch {
      this.previewEl.style.display = 'none';
    }
  }

  private selectAll(): void {
    for (let i = 1; i <= this.state.pageCount; i++) {
      this.state.selectedPages.add(i);
    }
    this.syncThumbUI();
    this.syncButtons();
  }

  private clearSelection(): void {
    this.state.selectedPages.clear();
    this.state.previewPage = null;
    this.previewEl.style.display = 'none';
    this.syncThumbUI();
    this.syncButtons();
  }

  private syncThumbUI(): void {
    this.thumbsEl.querySelectorAll('.pdf-thumb').forEach(el => {
      const page = parseInt(el.getAttribute('data-page')!);
      const selected = this.state.selectedPages.has(page);
      el.classList.toggle('pdf-thumb--selected', selected);
      const cb = el.querySelector('.pdf-thumb-check') as HTMLInputElement;
      if (cb) cb.checked = selected;
    });
  }

  private syncButtons(): void {
    this.extractBtn.disabled = this.state.selectedPages.size === 0;
  }

  private async extractSelected(): Promise<void> {
    if (!this.state.pdfDoc || this.state.selectedPages.size === 0) return;
    this.extractBtn.disabled = true;
    this.extractBtn.textContent = 'Extracting...';

    try {
      const newPdf = await PDFDocument.create();
      const indices = Array.from(this.state.selectedPages).sort((a, b) => a - b).map(p => p - 1);
      const pages = await newPdf.copyPages(this.state.pdfDoc, indices);
      pages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, 'extracted-pages.pdf');
      Toast.success(`Extracted ${this.state.selectedPages.size} pages`);
      logToolAction('pdf-split', 'Extracted PDF pages');
    } catch {
      Toast.error('Failed to extract pages');
    }

    this.extractBtn.textContent = 'Extract Selected Pages';
    this.extractBtn.disabled = false;
  }

  private async splitAll(): Promise<void> {
    if (!this.state.pdfDoc) return;
    this.splitAllBtn.disabled = true;
    this.splitAllBtn.textContent = 'Splitting...';

    try {
      const files: Array<{ name: string; data: Blob }> = [];
      for (let i = 0; i < this.state.pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(this.state.pdfDoc, [i]);
        newPdf.addPage(page);
        const pdfBytes = await newPdf.save();
        files.push({ name: `page-${i + 1}.pdf`, data: new Blob([pdfBytes], { type: 'application/pdf' }) });
      }

      await downloadZip(files, 'split-pages.zip');
      Toast.success(`Split into ${this.state.pageCount} pages`);
      logToolAction('pdf-split', 'Split PDF into pages');
    } catch {
      Toast.error('Failed to split PDF');
    }

    this.splitAllBtn.textContent = 'Split All Pages (ZIP)';
    this.splitAllBtn.disabled = false;
  }

  private cleanupProxy(): void {
    this.state.pdfDocProxy = null;
  }

  destroy(): void {
    this.cleanupProxy();
    this.state.pdfDoc = null;
    this.state.pdfBytes = null;
    this.state.file = null;
    this.thumbsEl.innerHTML = '';
    this.previewEl.style.display = 'none';
  }
}
