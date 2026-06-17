import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfFile {
  file: File;
  name: string;
  pageCount: number;
  size: string;
  thumbDataUrl?: string;
}

export class PdfMerge {
  id = 'pdf-merge';
  name = 'PDF Merger';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`;

  private pdfFiles: PdfFile[] = [];
  private listEl!: HTMLDivElement;
  private mergeBtn!: HTMLButtonElement;
  private dropZone!: HTMLDivElement;
  private draggedIndex: number | null = null;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfm-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>Drop PDF files here or <strong>click to browse</strong></p>
          <span class="pdf-drop-hint">Supports multiple PDF files</span>
          <input type="file" accept=".pdf" multiple hidden>
        </div>
        <div class="pdf-file-list" id="pdfm-list" style="display:none;"></div>
        <div class="pdf-actions" id="pdfm-actions" style="display:none;">
          <button class="btn btn--primary" id="pdfm-merge" disabled>Merge PDFs</button>
          <button class="btn btn--ghost" id="pdfm-clear">Clear All</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.dropZone = root.querySelector('#pdfm-dropzone')!;
    this.listEl = root.querySelector('#pdfm-list')!;
    this.mergeBtn = root.querySelector('#pdfm-merge')!;
    const fileInput = this.dropZone.querySelector('input')!;

    this.dropZone.addEventListener('click', () => fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropZone.classList.add('pdf-drop-zone--active'); });
    this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('pdf-drop-zone--active'));
    this.dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('pdf-drop-zone--active');
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type === 'application/pdf');
      await this.addFiles(files);
    });

    fileInput.addEventListener('change', async () => {
      const files = Array.from(fileInput.files || []);
      await this.addFiles(files);
      fileInput.value = '';
    });

    this.mergeBtn.addEventListener('click', () => this.merge());
    root.querySelector('#pdfm-clear')?.addEventListener('click', () => {
      this.pdfFiles = [];
      this.renderList();
    });
  }

  private async addFiles(files: File[]): Promise<void> {
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const thumbDataUrl = await this.renderFirstPageToDataUrl(file);
        this.pdfFiles.push({
          file,
          name: file.name,
          pageCount: pdf.getPageCount(),
          size: formatBytes(file.size),
          thumbDataUrl,
        });
      } catch {
        Toast.error(`Failed to read ${file.name}`);
      }
    }
    this.renderList();
  }

  private async renderFirstPageToDataUrl(file: File): Promise<string> {
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }

  private renderList(): void {
    if (this.pdfFiles.length === 0) {
      this.listEl.style.display = 'none';
      this.listEl.parentElement?.querySelector('.pdf-actions')?.setAttribute('style', 'display:none;');
      return;
    }

    this.listEl.style.display = '';
    this.listEl.parentElement?.querySelector('.pdf-actions')?.removeAttribute('style');
    this.mergeBtn.disabled = this.pdfFiles.length < 2;

    this.listEl.innerHTML = this.pdfFiles.map((f, i) => `
      <div class="pdf-file-item" draggable="true" data-index="${i}">
        <span class="pdf-file-handle">⠿</span>
        ${f.thumbDataUrl
          ? `<img class="pdf-merge-thumb" src="${f.thumbDataUrl}" alt="Page 1 of ${f.name}">`
          : '<span class="pdf-file-icon">📄</span>'}
        <div class="pdf-file-info">
          <span class="pdf-file-name">${f.name}</span>
          <span class="pdf-file-meta">${f.pageCount} pages · ${f.size}</span>
        </div>
        <button class="btn btn--ghost btn--sm pdf-file-remove" data-index="${i}">×</button>
      </div>
    `).join('');

    // Drag & drop reordering
    this.listEl.querySelectorAll('.pdf-file-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.draggedIndex = parseInt((item as HTMLElement).dataset.index!);
        (e as DragEvent).dataTransfer!.effectAllowed = 'move';
        item.classList.add('pdf-file-item--dragging');
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('pdf-file-item--dragging');
        this.draggedIndex = null;
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        (e as DragEvent).dataTransfer!.dropEffect = 'move';
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = parseInt((item as HTMLElement).dataset.index!);
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
          const [moved] = this.pdfFiles.splice(this.draggedIndex, 1);
          this.pdfFiles.splice(targetIndex, 0, moved);
          this.renderList();
        }
      });
    });

    this.listEl.querySelectorAll('.pdf-file-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.index!);
        this.pdfFiles.splice(idx, 1);
        this.renderList();
      });
    });
  }

  private async merge(): Promise<void> {
    if (this.pdfFiles.length < 2) return;
    this.mergeBtn.textContent = 'Merging...';
    this.mergeBtn.disabled = true;

    try {
      const merged = await PDFDocument.create();
      for (const pdfFile of this.pdfFiles) {
        const bytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => merged.addPage(page));
      }

      const pdfBytes = await merged.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, 'merged.pdf');
      Toast.success(`Merged ${this.pdfFiles.length} PDFs`);
      logToolAction('pdf-merge', 'Merged PDFs');
    } catch {
      Toast.error('Failed to merge PDFs');
    }

    this.mergeBtn.textContent = 'Merge PDFs';
    this.mergeBtn.disabled = false;
  }

  destroy(): void {}
}
