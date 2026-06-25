import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { logDownload } from '../../../utils/download-tracker';
import { downloadBlob, formatBytes, stampPdfMetadata } from '../../../utils/image';

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' },
);

interface SplitState {
  file: File | null;
  pdfBytes: ArrayBuffer | null;
  pdfDoc: PDFDocument | null;
  pdfDocProxy: PDFDocumentProxy | null;
  pageCount: number;
  selectedPages: Set<number>;
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
    loading: false,
  };

  private containerEl!: HTMLDivElement;
  private gridEl!: HTMLDivElement;
  private extractBtn!: HTMLButtonElement;

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
          <div class="pdf-split-hint" id="pdfs-hint">Click pages to select which ones to keep</div>
          <div class="pdf-split-grid" id="pdfs-grid"></div>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfs-extract" disabled>Download Selected Pages</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfs-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfs-controls')!;
    this.gridEl = root.querySelector('#pdfs-grid')!;
    this.extractBtn = root.querySelector('#pdfs-extract')!;
    const fileInput = dropZone.querySelector('input')!;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('pdf-drop-zone--active');
    });
    dropZone.addEventListener('dragleave', () =>
      dropZone.classList.remove('pdf-drop-zone--active'),
    );
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

    root.querySelector('#pdfs-change')?.addEventListener('click', () => {
      this.cleanupProxy();
      this.state.file = null;
      this.state.pdfBytes = null;
      this.state.pdfDoc = null;
      this.state.selectedPages.clear();
      this.gridEl.innerHTML = '';
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.cleanupProxy();

    this.state.file = file;
    this.state.loading = true;
    this.state.selectedPages.clear();

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

    this.syncButtons();

    try {
      this.state.pdfDocProxy = await pdfjsLib.getDocument({ data: this.state.pdfBytes.slice(0) })
        .promise;
      await this.renderPages();
    } catch (e) {
      console.error('PDF rendering failed:', e);
      this.gridEl.innerHTML =
        '<p class="pdf-note">Failed to load PDF renderer. Page previews unavailable.</p>';
    }

    this.state.loading = false;
  }

  private async renderPages(): Promise<void> {
    this.gridEl.innerHTML = '';
    const pdf = this.state.pdfDocProxy;
    if (!pdf) return;

    let rendered = 0;
    for (let i = 1; i <= this.state.pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        const card = document.createElement('div');
        card.className = 'pdf-split-card';
        card.dataset.page = String(i);

        const check = document.createElement('div');
        check.className = 'pdf-split-card-check';
        check.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;

        const label = document.createElement('span');
        label.className = 'pdf-split-card-label';
        label.textContent = String(i);

        card.appendChild(canvas);
        card.appendChild(check);
        card.appendChild(label);

        card.addEventListener('click', () => this.togglePage(i, card));
        this.gridEl.appendChild(card);
        rendered++;
      } catch (e) {
        console.warn(`Failed to render page ${i}:`, e);
      }
    }

    if (rendered === 0) {
      this.gridEl.innerHTML =
        '<p class="pdf-note">Failed to render page previews. You can still extract pages using pdf-lib.</p>';
    }
  }

  private togglePage(pageNum: number, card: HTMLDivElement): void {
    if (this.state.selectedPages.has(pageNum)) {
      this.state.selectedPages.delete(pageNum);
      card.classList.remove('pdf-split-card--selected');
    } else {
      this.state.selectedPages.add(pageNum);
      card.classList.add('pdf-split-card--selected');
    }
    this.syncButtons();
  }

  private syncButtons(): void {
    const count = this.state.selectedPages.size;
    this.extractBtn.disabled = count === 0;
    this.extractBtn.textContent =
      count === 0 ? 'Download Selected Pages' : `Download ${count} Page${count > 1 ? 's' : ''}`;
  }

  private async extractSelected(): Promise<void> {
    if (!this.state.pdfDoc || this.state.selectedPages.size === 0) return;
    this.extractBtn.disabled = true;
    this.extractBtn.textContent = 'Preparing download...';

    try {
      const newPdf = await PDFDocument.create();
      const indices = Array.from(this.state.selectedPages)
        .sort((a, b) => a - b)
        .map((p) => p - 1);
      const pages = await newPdf.copyPages(this.state.pdfDoc, indices);
      pages.forEach((p) => newPdf.addPage(p));
      stampPdfMetadata(newPdf);

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      downloadBlob(blob, 'extracted-pages.pdf');
      logDownload('pdf-split', 'PDF Splitter', blob, 'extracted-pages.pdf');
      Toast.success(`Downloaded ${this.state.selectedPages.size} pages`);
      logToolAction('pdf-split', 'Extracted PDF pages');
    } catch {
      Toast.error('Failed to extract pages');
    }

    this.syncButtons();
  }

  private cleanupProxy(): void {
    this.state.pdfDocProxy = null;
  }

  destroy(): void {
    this.cleanupProxy();
    this.state.pdfDoc = null;
    this.state.pdfBytes = null;
    this.state.file = null;
    this.gridEl.innerHTML = '';
  }
}
