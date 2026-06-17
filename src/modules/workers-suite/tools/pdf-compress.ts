import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export class PdfCompress {
  id = 'pdf-compress';
  name = 'PDF Compressor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6M9 15l3 3 3-3"/></svg>`;

  private file: File | null = null;
  private containerEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private originalSizeEl!: HTMLSpanElement;
  private compressedSizeEl!: HTMLSpanElement;
  private savingsEl!: HTMLSpanElement;
  private compressBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfc-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-compress-controls" id="pdfc-controls" style="display:none;">
          <canvas id="pdfc-preview" class="pdf-preview-canvas" style="display:none;"></canvas>
          <div class="pdf-compress-info">
            <div class="pdf-stat">
              <span class="pdf-stat-label">Original</span>
              <span class="pdf-stat-value" id="pdfc-original">—</span>
            </div>
            <div class="pdf-stat-arrow">→</div>
            <div class="pdf-stat">
              <span class="pdf-stat-label">Compressed</span>
              <span class="pdf-stat-value" id="pdfc-compressed">—</span>
            </div>
            <div class="pdf-stat">
              <span class="pdf-stat-label">Saved</span>
              <span class="pdf-stat-value pdf-stat-value--accent" id="pdfc-savings">—</span>
            </div>
          </div>
          <p class="pdf-note">Client-side PDF compression strips unused objects and metadata. Image re-encoding is not supported without heavier libraries — savings depend on PDF structure.</p>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfc-compress">Compress & Download</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfc-dropzone')!;
    this.containerEl = root.querySelector('#pdfc-controls')!;
    this.previewCanvas = root.querySelector('#pdfc-preview')!;
    this.originalSizeEl = root.querySelector('#pdfc-original')!;
    this.compressedSizeEl = root.querySelector('#pdfc-compressed')!;
    this.savingsEl = root.querySelector('#pdfc-savings')!;
    this.compressBtn = root.querySelector('#pdfc-compress')!;
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

    this.compressBtn.addEventListener('click', () => this.compress());
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.file = file;
    dropZone.style.display = 'none';
    this.containerEl.style.display = '';
    this.originalSizeEl.textContent = formatBytes(file.size);
    this.compressedSizeEl.textContent = '—';
    this.savingsEl.textContent = '—';

    // Render first page preview
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.8 });
      this.previewCanvas.width = viewport.width;
      this.previewCanvas.height = viewport.height;
      await page.render({ canvasContext: this.previewCanvas.getContext('2d')!, viewport }).promise;
      this.previewCanvas.style.display = '';
    } catch {
      this.previewCanvas.style.display = 'none';
    }
  }

  private async compress(): Promise<void> {
    if (!this.file) return;
    this.compressBtn.disabled = true;
    this.compressBtn.textContent = 'Compressing...';

    try {
      const bytes = await this.file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // Remove metadata
      pdf.setTitle('');
      pdf.setAuthor('');
      pdf.setSubject('');
      pdf.setKeywords([]);
      pdf.setProducer('');
      pdf.setCreator('');

      // Save with object streams (more compact)
      const compressedBytes = await pdf.save({ useObjectStreams: true });
      const compressedSize = compressedBytes.byteLength;
      const originalSize = this.file.size;

      this.compressedSizeEl.textContent = formatBytes(compressedSize);

      const savedBytes = originalSize - compressedSize;
      const savedPct = ((savedBytes / originalSize) * 100).toFixed(1);
      this.savingsEl.textContent = savedBytes > 0 ? `${formatBytes(savedBytes)} (${savedPct}%)` : 'No reduction';

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      const name = this.file.name.replace(/\.pdf$/i, '-compressed.pdf');
      downloadBlob(blob, name);
      Toast.success('PDF compressed');
      logToolAction('pdf-compress', 'Compressed PDF');
    } catch {
      Toast.error('Failed to compress PDF');
    }

    this.compressBtn.disabled = false;
    this.compressBtn.textContent = 'Compress & Download';
  }

  destroy(): void {}
}
