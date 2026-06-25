import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import type { DownloadedFile } from '../../../utils/download-tracker';
import {
  formatFileSize,
  formatTimeAgo,
  getRecentDownloads,
  getSessionBlob,
  logDownload,
} from '../../../utils/download-tracker';
import { downloadBlob, escapeHtml, formatBytes, stampPdfMetadata } from '../../../utils/image';

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' },
);

type SignMode = 'draw' | 'type' | 'upload' | 'default';

interface PlacedSignature {
  id: string;
  dataUrl: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SignState {
  file: File | null;
  pdfBytes: ArrayBuffer | null;
  pdfDoc: PDFDocument | null;
  pdfDocProxy: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  signatures: PlacedSignature[];
  activeSigId: string | null;
  isPreviewMode: boolean;
  sigW: number;
  sigH: number;
  loading: boolean;
  lastDownload: DownloadedFile | null;
  lastBlob: Blob | null;
}

export class PdfSign {
  id = 'pdf-sign';
  name = 'PDF Signature';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

  private state: SignState = {
    file: null,
    pdfBytes: null,
    pdfDoc: null,
    pdfDocProxy: null,
    currentPage: 1,
    totalPages: 1,
    signatures: [],
    activeSigId: null,
    isPreviewMode: false,
    sigW: 150,
    sigH: 60,
    loading: false,
    lastDownload: null,
    lastBlob: null,
  };

  private containerEl!: HTMLDivElement;
  private previewEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewCtx!: CanvasRenderingContext2D;
  private sigOverlay!: HTMLDivElement;
  private sigPreview!: HTMLImageElement;
  private sigPlaceholder!: HTMLSpanElement;
  private drawCanvas!: HTMLCanvasElement;
  private typeInput!: HTMLInputElement;
  private uploadInput!: HTMLInputElement;
  private doneBtn!: HTMLButtonElement;
  private downloadBtn!: HTMLButtonElement;
  private editBtn!: HTMLButtonElement;
  private pageNumEl!: HTMLSpanElement;
  private prevBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private loadingEl!: HTMLDivElement;
  private sigCountEl!: HTMLDivElement;
  private dimsEl!: HTMLSpanElement;
  private donePanel!: HTMLDivElement;
  private doneFilename!: HTMLParagraphElement;
  private doneDownloads!: HTMLDivElement;
  private downloadAgainBtn!: HTMLButtonElement;
  private signAnotherBtn!: HTMLButtonElement;

  private isDrawing = false;
  private drawCtx!: CanvasRenderingContext2D;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfsg-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-sign-controls" id="pdfsg-controls" style="display:none;">
          <div class="pdf-info-bar">
            <span id="pdfsg-info"></span>
            <button class="btn btn--ghost btn--sm" id="pdfsg-change">Change File</button>
          </div>
          <div class="pdf-sign-layout" id="pdfsg-edit-layout">
            <div class="pdf-sign-preview-wrap">
              <div class="pdf-sign-page-nav" id="pdfsg-page-nav">
                <button class="btn btn--ghost btn--sm" id="pdfsg-prev" disabled>←</button>
                <span>Page <span id="pdfsg-page">1</span> / <span id="pdfsg-total">1</span></span>
                <button class="btn btn--ghost btn--sm" id="pdfsg-next" disabled>→</button>
              </div>
              <label class="label" id="pdfsg-drag-hint">Drag to position · corners to resize</label>
              <div class="pdf-sign-preview" id="pdfsg-preview">
                <canvas id="pdfsg-canvas" class="pdf-sign-canvas"></canvas>
                <div class="pdf-sign-loading" id="pdfsg-loading" style="display:none;">Rendering...</div>
                <div class="pdf-sign-overlay" id="pdfsg-sig-overlay" style="display:none;">
                  <img id="pdfsg-sig-preview" class="pdf-sign-sig-img" style="display:none;">
                  <span class="pdf-sign-sig-placeholder" id="pdfsg-sig-placeholder">Signature</span>
                  <button class="pdf-sig-overlay-btn pdf-sig-overlay-btn--remove" id="pdfsg-overlay-remove" title="Remove">✕</button>
                  <button class="pdf-sig-overlay-btn pdf-sig-overlay-btn--done" id="pdfsg-overlay-done" title="Confirm">✓</button>
                  <div class="pdf-sig-handle pdf-sig-handle--nw" data-handle="nw"></div>
                  <div class="pdf-sig-handle pdf-sig-handle--ne" data-handle="ne"></div>
                  <div class="pdf-sig-handle pdf-sig-handle--sw" data-handle="sw"></div>
                  <div class="pdf-sig-handle pdf-sig-handle--se" data-handle="se"></div>
                </div>
              </div>
            </div>
            <div class="pdf-sign-options">
              <label class="label">Signature Input</label>
              <div class="pdf-sign-tabs">
                <button class="btn btn--ghost btn--sm pdf-sign-tab active" data-mode="draw">Draw</button>
                <button class="btn btn--ghost btn--sm pdf-sign-tab" data-mode="type">Type</button>
                <button class="btn btn--ghost btn--sm pdf-sign-tab" data-mode="upload">Upload</button>
                <button class="btn btn--ghost btn--sm pdf-sign-tab" data-mode="default">Default</button>
              </div>
              <div class="pdf-sign-draw" id="pdfsg-draw-panel">
                <canvas id="pdfsg-draw-canvas" class="pdf-sign-draw-canvas" width="300" height="100"></canvas>
                <button class="btn btn--ghost btn--sm" id="pdfsg-clear-draw">Clear</button>
              </div>
              <div class="pdf-sign-type" id="pdfsg-type-panel" style="display:none;">
                <select class="input" id="pdfsg-font">
                  <option value="'Dancing Script', cursive">Dancing Script</option>
                  <option value="'Great Vibes', cursive">Great Vibes</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="cursive">Default Cursive</option>
                </select>
                <input type="text" class="input" id="pdfsg-type-input" placeholder="Type your name">
                <button class="btn btn--ghost btn--sm" id="pdfsg-type-apply">Apply</button>
              </div>
              <div class="pdf-sign-upload" id="pdfsg-upload-panel" style="display:none;">
                <input type="file" id="pdfsg-upload-input" accept="image/*">
              </div>
              <div class="pdf-sign-default" id="pdfsg-default-panel" style="display:none;">
                <img class="pdf-sign-default-preview" id="pdfsg-default-preview" style="display:none;">
                <p class="pdf-note" id="pdfsg-default-empty" style="display:none;">No default signature saved. Draw, type, or upload one first.</p>
                <button class="btn btn--primary btn--sm" id="pdfsg-default-use" style="display:none;">Use This</button>
              </div>
              <div class="pdf-sig-dims" id="pdfsg-dims">150 × 60 px</div>
              <div class="pdf-sign-sig-count" id="pdfsg-sig-count"></div>
              <p class="pdf-note">Visual signature only — not a cryptographic digital signature.</p>
              <button class="btn btn--primary" id="pdfsg-done" style="display:none;">Preview Final</button>
              <button class="btn btn--primary" id="pdfsg-download" style="display:none;">Download Signed PDF</button>
              <button class="btn btn--ghost btn--sm" id="pdfsg-edit" style="display:none;">Edit Signatures</button>
            </div>
          </div>
          <div class="pdf-sign-done-panel" id="pdfsg-done-panel" style="display:none;">
            <div class="pdf-sign-done-header">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <h3>Download Complete</h3>
              <p class="pdf-sign-done-filename" id="pdfsg-done-filename"></p>
            </div>
            <div class="pdf-sign-done-downloads" id="pdfsg-done-downloads"></div>
            <div class="pdf-sign-done-actions">
              <button class="btn btn--primary" id="pdfsg-download-again">Download Again</button>
              <button class="btn btn--ghost" id="pdfsg-sign-another">Sign Another PDF</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfsg-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfsg-controls')!;
    this.previewEl = root.querySelector('#pdfsg-preview')!;
    this.previewCanvas = root.querySelector('#pdfsg-canvas')!;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this.sigOverlay = root.querySelector('#pdfsg-sig-overlay')!;
    this.sigPreview = root.querySelector('#pdfsg-sig-preview')!;
    this.sigPlaceholder = root.querySelector('#pdfsg-sig-placeholder')!;
    this.drawCanvas = root.querySelector('#pdfsg-draw-canvas')!;
    this.typeInput = root.querySelector('#pdfsg-type-input')!;
    this.uploadInput = root.querySelector('#pdfsg-upload-input')!;
    this.doneBtn = root.querySelector('#pdfsg-done')!;
    this.downloadBtn = root.querySelector('#pdfsg-download')!;
    this.editBtn = root.querySelector('#pdfsg-edit')!;
    this.pageNumEl = root.querySelector('#pdfsg-page')!;
    this.prevBtn = root.querySelector('#pdfsg-prev')!;
    this.nextBtn = root.querySelector('#pdfsg-next')!;
    this.loadingEl = root.querySelector('#pdfsg-loading')!;
    this.sigCountEl = root.querySelector('#pdfsg-sig-count')!;
    this.dimsEl = root.querySelector('#pdfsg-dims')!;
    this.donePanel = root.querySelector('#pdfsg-done-panel')!;
    this.doneFilename = root.querySelector('#pdfsg-done-filename')!;
    this.doneDownloads = root.querySelector('#pdfsg-done-downloads')!;
    this.downloadAgainBtn = root.querySelector('#pdfsg-download-again')!;
    this.signAnotherBtn = root.querySelector('#pdfsg-sign-another')!;
    const fileInput = dropZone.querySelector('input')!;

    this.sigOverlay.style.width = this.state.sigW + 'px';
    this.sigOverlay.style.height = this.state.sigH + 'px';

    // File input
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

    // Page navigation
    this.prevBtn.addEventListener('click', () => this.changePage(-1));
    this.nextBtn.addEventListener('click', () => this.changePage(1));

    // Signature input tabs
    root.querySelectorAll('.pdf-sign-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('.pdf-sign-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = (tab as HTMLElement).dataset.mode as SignMode;
        (root.querySelector('#pdfsg-draw-panel') as HTMLElement).style.display =
          mode === 'draw' ? '' : 'none';
        (root.querySelector('#pdfsg-type-panel') as HTMLElement).style.display =
          mode === 'type' ? '' : 'none';
        (root.querySelector('#pdfsg-upload-panel') as HTMLElement).style.display =
          mode === 'upload' ? '' : 'none';
        (root.querySelector('#pdfsg-default-panel') as HTMLElement).style.display =
          mode === 'default' ? '' : 'none';
      });
    });

    // Draw canvas
    this.drawCtx = this.drawCanvas.getContext('2d')!;
    this.drawCtx.strokeStyle = '#000';
    this.drawCtx.lineWidth = 2;
    this.drawCtx.lineCap = 'round';

    this.drawCanvas.addEventListener('pointerdown', (e) => {
      this.isDrawing = true;
      this.drawCtx.beginPath();
      this.drawCtx.moveTo(e.offsetX, e.offsetY);
    });
    this.drawCanvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      this.drawCtx.lineTo(e.offsetX, e.offsetY);
      this.drawCtx.stroke();
    });
    this.drawCanvas.addEventListener('pointerup', () => {
      this.isDrawing = false;
      this.addNewSignature(this.drawCanvas.toDataURL('image/png'));
    });
    this.drawCanvas.addEventListener('pointerleave', () => {
      this.isDrawing = false;
    });

    root.querySelector('#pdfsg-clear-draw')?.addEventListener('click', () => {
      this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    });

    // Type signature
    root
      .querySelector('#pdfsg-type-apply')
      ?.addEventListener('click', () => this.renderTypeSignature());
    this.typeInput.addEventListener('input', () => this.renderTypeSignature());

    // Upload signature
    this.uploadInput.addEventListener('change', () => {
      const file = this.uploadInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Convert non-PNG/JPEG to PNG via canvas (pdf-lib only supports those two)
        if (dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg')) {
          this.addNewSignature(dataUrl);
        } else {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            c.getContext('2d')!.drawImage(img, 0, 0);
            this.addNewSignature(c.toDataURL('image/png'));
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    });

    // Default signature
    this.loadDefaultSignature();

    // Overlay buttons
    root.querySelector('#pdfsg-overlay-remove')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeActiveSignature();
    });
    root.querySelector('#pdfsg-overlay-done')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.commitActiveSignature();
    });

    // Action buttons
    this.doneBtn.addEventListener('click', () => this.finalizePreview());
    this.downloadBtn.addEventListener('click', () => this.downloadSigned());
    this.editBtn.addEventListener('click', () => this.exitPreview());
    this.downloadAgainBtn.addEventListener('click', () => this.redownload());
    this.signAnotherBtn.addEventListener('click', () => this.resetToDropzone(dropZone));

    // Drag and resize
    this.setupDragAndResize();

    // Change file
    root.querySelector('#pdfsg-change')?.addEventListener('click', () => {
      this.resetToDropzone(dropZone);
    });
  }

  // ── Default signature ──

  private async loadDefaultSignature(): Promise<void> {
    const sig = await db.getPreference('defaultSignature', null);
    const previewImg = this.containerEl.querySelector('#pdfsg-default-preview') as HTMLImageElement;
    const emptyMsg = this.containerEl.querySelector('#pdfsg-default-empty') as HTMLParagraphElement;
    const useBtn = this.containerEl.querySelector('#pdfsg-default-use') as HTMLButtonElement;

    if (sig) {
      previewImg.src = sig as string;
      previewImg.style.display = '';
      emptyMsg.style.display = 'none';
      useBtn.style.display = '';
      useBtn.addEventListener('click', () => this.addNewSignature(sig as string));
    } else {
      previewImg.style.display = 'none';
      emptyMsg.style.display = '';
      useBtn.style.display = 'none';
    }
  }

  // ── Signature management ──

  private addNewSignature(dataUrl: string): void {
    const id = crypto.randomUUID();

    // Default position: bottom-right of canvas
    const canvasW = this.previewCanvas.width;
    const canvasH = this.previewCanvas.height;
    const canvasRect = this.previewCanvas.getBoundingClientRect();
    const cssScaleX = canvasRect.width / canvasW;
    const cssScaleY = canvasRect.height / canvasH;
    const sigCanvasW = this.state.sigW / cssScaleX;
    const sigCanvasH = this.state.sigH / cssScaleY;

    const sig: PlacedSignature = {
      id,
      dataUrl,
      page: this.state.currentPage,
      x: canvasW - sigCanvasW - 20,
      y: canvasH - sigCanvasH - 20,
      w: sigCanvasW,
      h: sigCanvasH,
    };

    this.state.signatures.push(sig);
    this.activateSignature(id);
    this.renderPlacedSignatures();
    this.updateSigCount();
    this.showDoneButton();
  }

  private activateSignature(id: string): void {
    const sig = this.state.signatures.find((s) => s.id === id);
    if (!sig) return;

    // Save overlay position to previously active sig
    this.saveOverlayToActiveSig();

    this.state.activeSigId = id;

    // Convert canvas-space to CSS for overlay display
    const canvasRect = this.previewCanvas.getBoundingClientRect();
    const cssScaleX = canvasRect.width / this.previewCanvas.width;
    const cssScaleY = canvasRect.height / this.previewCanvas.height;

    const cssW = sig.w * cssScaleX;
    const cssH = sig.h * cssScaleY;
    const cssX = sig.x * cssScaleX;
    const cssY = sig.y * cssScaleY;

    this.state.sigW = cssW;
    this.state.sigH = cssH;

    // Show overlay at signature position
    this.sigOverlay.style.display = '';
    this.sigOverlay.style.left = cssX + 'px';
    this.sigOverlay.style.top = cssY + 'px';
    this.sigOverlay.style.width = cssW + 'px';
    this.sigOverlay.style.height = cssH + 'px';
    this.sigPreview.src = sig.dataUrl;
    this.sigPreview.style.display = '';
    this.sigPlaceholder.style.display = 'none';
    this.updateDimsDisplay();

    // Hide the <img> for this sig (overlay replaces it)
    const imgEl = this.previewEl.querySelector(
      `.pdf-sign-placed[data-sig-id="${id}"]`,
    ) as HTMLElement;
    if (imgEl) imgEl.style.display = 'none';

    // Highlight active, un-highlight others
    this.previewEl.querySelectorAll('.pdf-sign-placed').forEach((el) => {
      const elId = (el as HTMLElement).dataset.sigId;
      if (elId !== id) (el as HTMLElement).classList.remove('pdf-sign-placed--active');
    });

    // If sig is on a different page, navigate there
    if (sig.page !== this.state.currentPage && !this.state.isPreviewMode) {
      this.state.currentPage = sig.page;
      this.renderPage(sig.page).then(() => this.renderPlacedSignatures());
    }
  }

  private commitActiveSignature(): void {
    const sig = this.getActiveSignature();
    if (!sig) return;

    // Save overlay CSS position → convert to canvas-space
    const canvasRect = this.previewCanvas.getBoundingClientRect();
    const scaleX = this.previewCanvas.width / canvasRect.width;
    const scaleY = this.previewCanvas.height / canvasRect.height;

    sig.x = this.sigOverlay.offsetLeft * scaleX;
    sig.y = this.sigOverlay.offsetTop * scaleY;
    sig.w = this.sigOverlay.offsetWidth * scaleX;
    sig.h = this.sigOverlay.offsetHeight * scaleY;

    // Hide overlay, show <img>
    this.sigOverlay.style.display = 'none';
    this.state.activeSigId = null;

    this.renderPlacedSignatures();
    this.updateSigCount();
    this.showDoneButton();
    Toast.success('Signature placed');
  }

  private removeActiveSignature(): void {
    const id = this.state.activeSigId;
    if (!id) return;

    this.state.signatures = this.state.signatures.filter((s) => s.id !== id);
    this.state.activeSigId = null;

    // Remove <img> and hide overlay
    this.previewEl.querySelector(`.pdf-sign-placed[data-sig-id="${id}"]`)?.remove();
    this.sigOverlay.style.display = 'none';

    this.updateSigCount();
    this.showDoneButton();
    Toast.success('Signature removed');
  }

  private saveOverlayToActiveSig(): void {
    const sig = this.getActiveSignature();
    if (!sig) return;
    const canvasRect = this.previewCanvas.getBoundingClientRect();
    const scaleX = this.previewCanvas.width / canvasRect.width;
    const scaleY = this.previewCanvas.height / canvasRect.height;
    sig.x = this.sigOverlay.offsetLeft * scaleX;
    sig.y = this.sigOverlay.offsetTop * scaleY;
    sig.w = this.sigOverlay.offsetWidth * scaleX;
    sig.h = this.sigOverlay.offsetHeight * scaleY;
  }

  private getActiveSignature(): PlacedSignature | undefined {
    return this.state.signatures.find((s) => s.id === this.state.activeSigId);
  }

  // ── Render placed signatures ──

  private renderPlacedSignatures(): void {
    this.previewEl.querySelectorAll('.pdf-sign-placed').forEach((el) => el.remove());

    const pageSigs = this.state.signatures.filter((s) => s.page === this.state.currentPage);
    const canvasRect = this.previewCanvas.getBoundingClientRect();
    const cssScaleX = canvasRect.width / this.previewCanvas.width;
    const cssScaleY = canvasRect.height / this.previewCanvas.height;

    for (const sig of pageSigs) {
      // Skip active signature (overlay handles it)
      if (sig.id === this.state.activeSigId) continue;

      const img = document.createElement('img');
      img.className = 'pdf-sign-placed';
      img.src = sig.dataUrl;
      img.dataset.sigId = sig.id;
      img.style.cssText = `position:absolute;left:${sig.x * cssScaleX}px;top:${sig.y * cssScaleY}px;width:${sig.w * cssScaleX}px;height:${sig.h * cssScaleY}px;`;
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activateSignature(sig.id);
      });
      this.previewEl.appendChild(img);
    }
  }

  private updateSigCount(): void {
    const total = this.state.signatures.length;
    if (total === 0) {
      this.sigCountEl.textContent = '';
      return;
    }
    const byPage = new Map<number, number>();
    for (const sig of this.state.signatures) {
      byPage.set(sig.page, (byPage.get(sig.page) || 0) + 1);
    }
    const parts = Array.from(byPage.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([p, c]) => `page ${p}: ${c}`);
    this.sigCountEl.textContent = `${total} signature${total > 1 ? 's' : ''} placed (${parts.join(', ')})`;
  }

  private showDoneButton(): void {
    this.doneBtn.style.display = this.state.signatures.length > 0 ? '' : 'none';
  }

  // ── Preview mode ──

  private async finalizePreview(): Promise<void> {
    this.saveOverlayToActiveSig();
    this.state.activeSigId = null;
    this.state.isPreviewMode = true;

    // Burn current page signatures into canvas
    await this.burnSignaturesIntoCanvas(this.state.currentPage);

    // Hide editing UI
    this.sigOverlay.style.display = 'none';
    this.previewEl.querySelectorAll('.pdf-sign-placed').forEach((el) => el.remove());
    this.doneBtn.style.display = 'none';

    // Show download/edit buttons
    this.downloadBtn.style.display = '';
    this.editBtn.style.display = '';

    const hint = this.containerEl.querySelector('#pdfsg-drag-hint') as HTMLElement;
    if (hint) hint.style.display = 'none';
  }

  private exitPreview(): void {
    this.state.isPreviewMode = false;

    this.renderPage(this.state.currentPage).then(() => {
      this.renderPlacedSignatures();
    });

    this.sigOverlay.style.display = '';
    this.doneBtn.style.display = '';
    this.downloadBtn.style.display = 'none';
    this.editBtn.style.display = 'none';

    const hint = this.containerEl.querySelector('#pdfsg-drag-hint') as HTMLElement;
    if (hint) hint.style.display = '';
  }

  private async burnSignaturesIntoCanvas(pageNum: number): Promise<void> {
    const pdf = this.state.pdfDocProxy;
    if (!pdf) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      this.previewCanvas.width = viewport.width;
      this.previewCanvas.height = viewport.height;
      this.previewCtx.clearRect(0, 0, viewport.width, viewport.height);

      await page.render({
        canvas: this.previewCanvas,
        canvasContext: this.previewCtx,
        viewport,
      }).promise;

      // Draw all signatures for this page (already in canvas-space)
      const pageSigs = this.state.signatures.filter((s) => s.page === pageNum);
      for (const sig of pageSigs) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = sig.dataUrl;
        });
        this.previewCtx.drawImage(img, sig.x, sig.y, sig.w, sig.h);
      }
    } catch (e) {
      console.error('Failed to burn signatures:', e);
    }
  }

  // ── Download ──

  private async downloadSigned(): Promise<void> {
    if (!this.state.pdfBytes || !this.state.file) return;
    this.downloadBtn.disabled = true;
    this.downloadBtn.textContent = 'Preparing download...';

    try {
      const freshBytes = this.state.pdfBytes.slice(0);
      const pdfDoc = await PDFDocument.load(freshBytes, { ignoreEncryption: true });

      for (const sig of this.state.signatures) {
        const sigBytes = await (await fetch(sig.dataUrl)).arrayBuffer();
        const isJpeg = sig.dataUrl.startsWith('data:image/jpeg');
        const sigImage = isJpeg ? await pdfDoc.embedJpg(sigBytes) : await pdfDoc.embedPng(sigBytes);
        const page = pdfDoc.getPages()[sig.page - 1];
        const { width: pdfW, height: pdfH } = page.getSize();

        // Convert canvas-space to PDF-space
        const pdfScaleX = pdfW / this.previewCanvas.width;
        const pdfScaleY = pdfH / this.previewCanvas.height;

        page.drawImage(sigImage, {
          x: sig.x * pdfScaleX,
          y: pdfH - (sig.y + sig.h) * pdfScaleY,
          width: sig.w * pdfScaleX,
          height: sig.h * pdfScaleY,
        });
      }

      stampPdfMetadata(pdfDoc);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const name = this.state.file.name.replace(/\.pdf$/i, '-signed.pdf');
      downloadBlob(blob, name);

      const date = new Date().toISOString().slice(0, 10);
      const finalName = `[Inztun] ${name.replace(/\.pdf$/i, '')}-${date}.pdf`;
      const record = await logDownload('pdf-sign', 'PDF Signature', blob, finalName);

      this.state.lastDownload = record;
      this.state.lastBlob = blob;

      Toast.success('PDF signed');
      logToolAction('pdf-sign', 'Signed PDF');

      this.showDownloadPanel();
    } catch (e) {
      console.error('Failed to sign PDF:', e);
      Toast.error('Failed to sign PDF');
    }

    this.downloadBtn.textContent = 'Download Signed PDF';
    this.downloadBtn.disabled = false;
  }

  private showDownloadPanel(): void {
    // Hide editing layout
    const editLayout = this.containerEl.querySelector('#pdfsg-edit-layout') as HTMLElement;
    if (editLayout) editLayout.style.display = 'none';

    // Show done panel
    this.donePanel.style.display = '';
    this.doneFilename.textContent = this.state.lastDownload?.name || '';

    // Render recent downloads
    this.renderRecentDownloads();
  }

  private async renderRecentDownloads(): Promise<void> {
    const downloads = await getRecentDownloads(10);
    this.doneDownloads.innerHTML = '';

    for (const dl of downloads) {
      const hasBlob = getSessionBlob(dl.id) !== undefined;
      const item = document.createElement('div');
      item.className = 'pdf-sign-done-item' + (hasBlob ? '' : ' pdf-sign-done-item--disabled');
      item.innerHTML = `
        <span class="pdf-sign-done-item-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </span>
        <div class="pdf-sign-done-item-info">
          <span class="pdf-sign-done-item-name">${escapeHtml(dl.name)}</span>
          <span class="pdf-sign-done-item-meta">${dl.toolName} · ${formatTimeAgo(dl.timestamp)} · ${formatFileSize(dl.size)}${hasBlob ? '' : ' · Expired'}</span>
        </div>
      `;
      if (hasBlob) {
        item.addEventListener('click', () => {
          const blob = getSessionBlob(dl.id)!;
          downloadBlob(blob, dl.name);
        });
      }
      this.doneDownloads.appendChild(item);
    }
  }

  private redownload(): void {
    if (this.state.lastBlob && this.state.lastDownload) {
      downloadBlob(this.state.lastBlob, this.state.lastDownload.name);
    }
  }

  private resetToDropzone(dropZone: HTMLDivElement): void {
    this.cleanupProxy();
    this.state.file = null;
    this.state.pdfBytes = null;
    this.state.pdfDoc = null;
    this.state.signatures = [];
    this.state.activeSigId = null;
    this.state.isPreviewMode = false;
    this.state.lastDownload = null;
    this.state.lastBlob = null;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.previewEl.querySelectorAll('.pdf-sign-placed').forEach((el) => el.remove());
    this.containerEl.style.display = 'none';
    dropZone.style.display = '';

    // Reset done panel
    this.donePanel.style.display = 'none';
    const editLayout = this.containerEl.querySelector('#pdfsg-edit-layout') as HTMLElement;
    if (editLayout) editLayout.style.display = '';
  }

  // ── File loading ──

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.cleanupProxy();

    this.state.file = file;
    this.state.currentPage = 1;
    this.state.signatures = [];
    this.state.activeSigId = null;
    this.state.isPreviewMode = false;
    this.state.lastDownload = null;
    this.state.lastBlob = null;
    this.state.loading = true;

    try {
      this.state.pdfBytes = await file.arrayBuffer();
      this.state.pdfDoc = await PDFDocument.load(this.state.pdfBytes, { ignoreEncryption: true });
      this.state.totalPages = this.state.pdfDoc.getPageCount();
    } catch {
      Toast.error('Failed to load PDF');
      this.state.loading = false;
      return;
    }

    dropZone.style.display = 'none';
    this.containerEl.style.display = '';

    const infoEl = this.containerEl.querySelector('#pdfsg-info')!;
    infoEl.textContent = `${file.name} · ${this.state.totalPages} pages · ${formatBytes(file.size)}`;

    // Reset UI
    this.donePanel.style.display = 'none';
    const editLayout = this.containerEl.querySelector('#pdfsg-edit-layout') as HTMLElement;
    if (editLayout) editLayout.style.display = '';
    this.downloadBtn.style.display = 'none';
    this.editBtn.style.display = 'none';
    this.doneBtn.style.display = 'none';
    this.sigOverlay.style.display = 'none';
    this.sigCountEl.textContent = '';
    const hint = this.containerEl.querySelector('#pdfsg-drag-hint') as HTMLElement;
    if (hint) hint.style.display = '';

    this.updatePageNav();
    this.resetOverlay();

    try {
      this.state.pdfDocProxy = await pdfjsLib.getDocument({ data: this.state.pdfBytes.slice(0) })
        .promise;
      await this.renderPage(this.state.currentPage);
    } catch (e) {
      console.error('PDF rendering failed:', e);
      Toast.error('Failed to load PDF renderer — page preview unavailable');
    }

    this.state.loading = false;
  }

  // ── Page navigation ──

  private async changePage(delta: number): Promise<void> {
    const next = this.state.currentPage + delta;
    if (next < 1 || next > this.state.totalPages) return;

    if (this.state.isPreviewMode) {
      this.state.isPreviewMode = false;
      this.downloadBtn.style.display = 'none';
      this.editBtn.style.display = 'none';
      const hint = this.containerEl.querySelector('#pdfsg-drag-hint') as HTMLElement;
      if (hint) hint.style.display = '';
    }

    this.saveOverlayToActiveSig();
    this.state.activeSigId = null;
    this.state.currentPage = next;
    this.updatePageNav();
    await this.renderPage(next);
    this.renderPlacedSignatures();

    // Activate first sig on new page, or hide overlay
    const pageSigs = this.state.signatures.filter((s) => s.page === next);
    if (pageSigs.length > 0) {
      this.activateSignature(pageSigs[0].id);
    } else {
      this.sigOverlay.style.display = 'none';
    }

    this.showDoneButton();
  }

  private updatePageNav(): void {
    this.pageNumEl.textContent = String(this.state.currentPage);
    (this.containerEl.querySelector('#pdfsg-total') as HTMLSpanElement).textContent = String(
      this.state.totalPages,
    );
    this.prevBtn.disabled = this.state.currentPage <= 1;
    this.nextBtn.disabled = this.state.currentPage >= this.state.totalPages;
  }

  // ── Overlay ──

  private resetOverlay(): void {
    this.sigOverlay.style.left = '';
    this.sigOverlay.style.top = '';
    this.sigOverlay.style.right = '';
    this.sigOverlay.style.bottom = '';
    this.state.sigW = 150;
    this.state.sigH = 60;
    this.sigOverlay.style.width = this.state.sigW + 'px';
    this.sigOverlay.style.height = this.state.sigH + 'px';
    this.updateDimsDisplay();
    this.positionOverlayDefault();
  }

  private positionOverlayDefault(): void {
    const rect = this.previewCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = rect.width - this.state.sigW - 20;
    const y = rect.height - this.state.sigH - 20;
    this.sigOverlay.style.left = Math.max(0, x) + 'px';
    this.sigOverlay.style.top = Math.max(0, y) + 'px';
  }

  private updateDimsDisplay(): void {
    if (this.dimsEl)
      this.dimsEl.textContent = `${Math.round(this.state.sigW)} × ${Math.round(this.state.sigH)} px`;
  }

  // ── Page rendering ──

  private async renderPage(pageNum: number): Promise<void> {
    const pdf = this.state.pdfDocProxy;
    if (!pdf) return;

    this.state.loading = true;
    this.loadingEl.style.display = '';

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      this.previewCanvas.width = viewport.width;
      this.previewCanvas.height = viewport.height;
      this.previewCtx.clearRect(0, 0, viewport.width, viewport.height);

      await page.render({
        canvas: this.previewCanvas,
        canvasContext: this.previewCtx,
        viewport,
      }).promise;

      this.positionOverlayDefault();
    } catch (e) {
      console.error('PDF page render failed:', e);
      Toast.error('Failed to render page');
    } finally {
      this.loadingEl.style.display = 'none';
      this.state.loading = false;
    }
  }

  // ── Type signature ──

  private renderTypeSignature(): void {
    const text = this.typeInput.value.trim();
    if (!text) return;
    const font = (document.getElementById('pdfsg-font') as HTMLSelectElement).value;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.font = `36px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, 40);
    this.addNewSignature(canvas.toDataURL('image/png'));
  }

  // ── Drag and resize ──

  private setupDragAndResize(): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    const clampToCanvas = (left: number, top: number, w: number, h: number) => {
      const canvasRect = this.previewCanvas.getBoundingClientRect();
      const maxLeft = canvasRect.width - w;
      const maxTop = canvasRect.height - h;
      return {
        left: Math.max(0, Math.min(left, maxLeft)),
        top: Math.max(0, Math.min(top, maxTop)),
      };
    };

    this.sigOverlay.addEventListener('pointerdown', (e) => {
      if (this.state.isPreviewMode) return;
      const target = e.target as HTMLElement;
      if (
        target.classList.contains('pdf-sig-handle') ||
        target.classList.contains('pdf-sig-overlay-btn')
      )
        return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = this.sigOverlay.offsetLeft;
      origTop = this.sigOverlay.offsetTop;
      this.sigOverlay.setPointerCapture(e.pointerId);
    });

    this.sigOverlay.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const clamped = clampToCanvas(origLeft + dx, origTop + dy, this.state.sigW, this.state.sigH);
      this.sigOverlay.style.left = clamped.left + 'px';
      this.sigOverlay.style.top = clamped.top + 'px';
    });

    this.sigOverlay.addEventListener('pointerup', () => {
      isDragging = false;
    });

    const handles = this.sigOverlay.querySelectorAll('.pdf-sig-handle');
    handles.forEach((handle) => {
      handle.addEventListener('pointerdown', (e) => {
        if (this.state.isPreviewMode) return;
        e.stopPropagation();
        const corner = (handle as HTMLElement).dataset.handle!;
        const handleEl = handle as HTMLElement;
        handleEl.setPointerCapture((e as PointerEvent).pointerId);

        const startClientX = (e as PointerEvent).clientX;
        const startClientY = (e as PointerEvent).clientY;
        const startLeft = this.sigOverlay.offsetLeft;
        const startTop = this.sigOverlay.offsetTop;
        const startW = this.sigOverlay.offsetWidth;
        const startH = this.sigOverlay.offsetHeight;
        const minW = 40;
        const minH = 20;

        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startClientX;
          const dy = ev.clientY - startClientY;

          let newLeft = startLeft;
          let newTop = startTop;
          let newW = startW;
          let newH = startH;

          switch (corner) {
            case 'se':
              newW = Math.max(minW, startW + dx);
              newH = Math.max(minH, startH + dy);
              break;
            case 'sw':
              newW = Math.max(minW, startW - dx);
              newH = Math.max(minH, startH + dy);
              if (newW >= minW) newLeft = startLeft + dx;
              break;
            case 'ne':
              newW = Math.max(minW, startW + dx);
              newH = Math.max(minH, startH - dy);
              if (newH >= minH) newTop = startTop + dy;
              break;
            case 'nw':
              newW = Math.max(minW, startW - dx);
              newH = Math.max(minH, startH - dy);
              if (newW >= minW) newLeft = startLeft + dx;
              if (newH >= minH) newTop = startTop + dy;
              break;
          }

          const canvasRect = this.previewCanvas.getBoundingClientRect();
          newW = Math.min(newW, canvasRect.width - newLeft);
          newH = Math.min(newH, canvasRect.height - newTop);

          this.sigOverlay.style.width = newW + 'px';
          this.sigOverlay.style.height = newH + 'px';
          this.sigOverlay.style.left = newLeft + 'px';
          this.sigOverlay.style.top = newTop + 'px';
          this.state.sigW = newW;
          this.state.sigH = newH;
          this.updateDimsDisplay();
        };

        const onUp = () => {
          handleEl.removeEventListener('pointermove', onMove);
          handleEl.removeEventListener('pointerup', onUp);
        };

        handleEl.addEventListener('pointermove', onMove);
        handleEl.addEventListener('pointerup', onUp);
      });
    });
  }

  private cleanupProxy(): void {
    this.state.pdfDocProxy = null;
  }

  destroy(): void {
    this.cleanupProxy();
    this.state.pdfDoc = null;
    this.state.pdfBytes = null;
    this.state.file = null;
    this.state.signatures = [];
    this.state.lastBlob = null;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.previewEl.querySelectorAll('.pdf-sign-placed').forEach((el) => el.remove());
  }
}
