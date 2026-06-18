import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PdfMetadata {
  id = 'pdf-metadata';
  name = 'PDF Metadata Editor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

  private file: File | null = null;
  private pdfDoc: PDFDocument | null = null;
  private containerEl!: HTMLDivElement;
  private fieldsEl!: HTMLDivElement;
  private infoEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private saveBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfmd-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-metadata-controls" id="pdfmd-controls" style="display:none;">
          <div class="pdf-info-bar">
            <span id="pdfmd-file-info"></span>
            <button class="btn btn--ghost btn--sm" id="pdfmd-change">Change File</button>
          </div>
          <div class="pdf-metadata-info" id="pdfmd-info"></div>
          <canvas id="pdfmd-preview" class="pdf-preview-canvas" style="display:none;"></canvas>
          <div class="pdf-metadata-fields" id="pdfmd-fields"></div>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfmd-save">Save Metadata & Download</button>
            <button class="btn btn--ghost" id="pdfmd-strip">Strip All Metadata & Download</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfmd-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfmd-controls')!;
    this.infoEl = root.querySelector('#pdfmd-info')!;
    this.fieldsEl = root.querySelector('#pdfmd-fields')!;
    this.previewCanvas = root.querySelector('#pdfmd-preview')!;
    this.saveBtn = root.querySelector('#pdfmd-save')!;
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

    this.saveBtn.addEventListener('click', () => this.saveMetadata());
    root.querySelector('#pdfmd-strip')?.addEventListener('click', () => this.stripMetadata());
    root.querySelector('#pdfmd-change')?.addEventListener('click', () => {
      this.file = null;
      this.pdfDoc = null;
      this.previewCanvas.style.display = 'none';
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    try {
      this.file = file;
      const bytes = await file.arrayBuffer();
      this.pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      dropZone.style.display = 'none';
      this.containerEl.style.display = '';

      const fileInfoEl = this.containerEl.querySelector('#pdfmd-file-info')!;
      fileInfoEl.textContent = `${file.name} · ${formatBytes(file.size)}`;

      this.renderInfo();
      this.renderFields();

      // Render first page preview
      try {
        const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.8 });
        this.previewCanvas.width = viewport.width;
        this.previewCanvas.height = viewport.height;
        await page.render({ canvas: this.previewCanvas, canvasContext: this.previewCanvas.getContext('2d')!, viewport }).promise;
        this.previewCanvas.style.display = '';
      } catch (e) {
        console.warn('PDF preview failed:', e);
        this.previewCanvas.style.display = 'none';
      }
    } catch {
      Toast.error('Failed to load PDF');
    }
  }

  private renderInfo(): void {
    if (!this.pdfDoc || !this.file) return;

    const pages = this.pdfDoc.getPageCount();
    const firstPage = this.pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    this.infoEl.innerHTML = `
      <div class="pdf-info-grid">
        <div class="pdf-info-item">
          <span class="pdf-info-label">File Size</span>
          <span class="pdf-info-value">${formatBytes(this.file.size)}</span>
        </div>
        <div class="pdf-info-item">
          <span class="pdf-info-label">Pages</span>
          <span class="pdf-info-value">${pages}</span>
        </div>
        <div class="pdf-info-item">
          <span class="pdf-info-label">Page Size</span>
          <span class="pdf-info-value">${Math.round(width)} × ${Math.round(height)} pt</span>
        </div>
        <div class="pdf-info-item">
          <span class="pdf-info-label">PDF Version</span>
          <span class="pdf-info-value">${this.pdfDoc.getProducer() ? 'Unknown' : '1.x'}</span>
        </div>
      </div>
    `;
  }

  private renderFields(): void {
    if (!this.pdfDoc) return;

    const fields = [
      { key: 'title', label: 'Title', value: this.pdfDoc.getTitle() || '' },
      { key: 'author', label: 'Author', value: this.pdfDoc.getAuthor() || '' },
      { key: 'subject', label: 'Subject', value: this.pdfDoc.getSubject() || '' },
      { key: 'keywords', label: 'Keywords', value: (this.pdfDoc.getKeywords() || '').toString() },
      { key: 'creator', label: 'Creator', value: this.pdfDoc.getCreator() || '' },
      { key: 'producer', label: 'Producer', value: this.pdfDoc.getProducer() || '' },
    ];

    this.fieldsEl.innerHTML = fields.map(f => `
      <div class="form-group">
        <label class="label">${f.label}</label>
        <input type="text" class="input pdf-meta-input" data-key="${f.key}" value="${this.escapeHtml(f.value)}">
      </div>
    `).join('');
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private async saveMetadata(): Promise<void> {
    if (!this.pdfDoc || !this.file) return;
    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Saving...';

    try {
      const inputs = this.fieldsEl.querySelectorAll('.pdf-meta-input');
      inputs.forEach(input => {
        const key = (input as HTMLInputElement).dataset.key!;
        const value = (input as HTMLInputElement).value;
        switch (key) {
          case 'title': this.pdfDoc!.setTitle(value); break;
          case 'author': this.pdfDoc!.setAuthor(value); break;
          case 'subject': this.pdfDoc!.setSubject(value); break;
          case 'keywords': this.pdfDoc!.setKeywords(value.split(',').map(s => s.trim()).filter(Boolean)); break;
          case 'creator': this.pdfDoc!.setCreator(value); break;
          case 'producer': this.pdfDoc!.setProducer(value); break;
        }
      });

      const pdfBytes = await this.pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const name = this.file.name.replace(/\.pdf$/i, '-updated.pdf');
      downloadBlob(blob, name);
      Toast.success('Metadata saved');
      logToolAction('pdf-metadata', 'Updated PDF metadata');
    } catch {
      Toast.error('Failed to save metadata');
    }

    this.saveBtn.disabled = false;
    this.saveBtn.textContent = 'Save Metadata & Download';
  }

  private async stripMetadata(): Promise<void> {
    if (!this.pdfDoc || !this.file) return;

    try {
      this.pdfDoc.setTitle('');
      this.pdfDoc.setAuthor('');
      this.pdfDoc.setSubject('');
      this.pdfDoc.setKeywords([]);
      this.pdfDoc.setCreator('');
      this.pdfDoc.setProducer('');

      const pdfBytes = await this.pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const name = this.file.name.replace(/\.pdf$/i, '-stripped.pdf');
      downloadBlob(blob, name);
      Toast.success('Metadata stripped');
      logToolAction('pdf-metadata', 'Stripped PDF metadata');

      // Refresh fields
      this.renderFields();
    } catch {
      Toast.error('Failed to strip metadata');
    }
  }

  destroy(): void {}
}
