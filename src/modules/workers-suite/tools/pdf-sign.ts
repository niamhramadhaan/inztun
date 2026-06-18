import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type SignMode = 'draw' | 'type' | 'upload';

interface SignState {
  file: File | null;
  pdfBytes: ArrayBuffer | null;
  pdfDoc: PDFDocument | null;
  pdfDocProxy: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  signatureDataUrl: string | null;
  sigW: number;
  sigH: number;
  loading: boolean;
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
    signatureDataUrl: null,
    sigW: 150,
    sigH: 60,
    loading: false,
  };

  private containerEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private previewCtx!: CanvasRenderingContext2D;
  private sigOverlay!: HTMLDivElement;
  private sigPreview!: HTMLImageElement;
  private sigPlaceholder!: HTMLSpanElement;
  private drawCanvas!: HTMLCanvasElement;
  private typeInput!: HTMLInputElement;
  private uploadInput!: HTMLInputElement;
  private placeBtn!: HTMLButtonElement;
  private pageNumEl!: HTMLSpanElement;
  private prevBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private loadingEl!: HTMLDivElement;

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
          <div class="pdf-sign-layout">
            <div class="pdf-sign-preview-wrap">
              <div class="pdf-sign-page-nav" id="pdfsg-page-nav">
                <button class="btn btn--ghost btn--sm" id="pdfsg-prev" disabled>←</button>
                <span>Page <span id="pdfsg-page">1</span> / <span id="pdfsg-total">1</span></span>
                <button class="btn btn--ghost btn--sm" id="pdfsg-next" disabled>→</button>
              </div>
              <label class="label">Drag to position · corners to resize</label>
              <div class="pdf-sign-preview" id="pdfsg-preview">
                <canvas id="pdfsg-canvas" class="pdf-sign-canvas"></canvas>
                <div class="pdf-sign-loading" id="pdfsg-loading" style="display:none;">Rendering...</div>
                <div class="pdf-sign-overlay" id="pdfsg-sig-overlay">
                  <img id="pdfsg-sig-preview" class="pdf-sign-sig-img" style="display:none;">
                  <span class="pdf-sign-sig-placeholder" id="pdfsg-sig-placeholder">Signature</span>
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
              <div class="pdf-sig-dims" id="pdfsg-dims">150 × 60 px</div>
              <p class="pdf-note">Visual signature only — not a cryptographic digital signature.</p>
              <button class="btn btn--primary" id="pdfsg-place" disabled>Sign & Download</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfsg-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfsg-controls')!;
    this.previewCanvas = root.querySelector('#pdfsg-canvas')!;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this.sigOverlay = root.querySelector('#pdfsg-sig-overlay')!;
    this.sigPreview = root.querySelector('#pdfsg-sig-preview')!;
    this.sigPlaceholder = root.querySelector('#pdfsg-sig-placeholder')!;
    this.drawCanvas = root.querySelector('#pdfsg-draw-canvas')!;
    this.typeInput = root.querySelector('#pdfsg-type-input')!;
    this.uploadInput = root.querySelector('#pdfsg-upload-input')!;
    this.placeBtn = root.querySelector('#pdfsg-place')!;
    this.pageNumEl = root.querySelector('#pdfsg-page')!;
    this.prevBtn = root.querySelector('#pdfsg-prev')!;
    this.nextBtn = root.querySelector('#pdfsg-next')!;
    this.loadingEl = root.querySelector('#pdfsg-loading')!;
    const fileInput = dropZone.querySelector('input')!;

    this.sigOverlay.style.width = this.state.sigW + 'px';
    this.sigOverlay.style.height = this.state.sigH + 'px';

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

    this.prevBtn.addEventListener('click', () => this.changePage(-1));
    this.nextBtn.addEventListener('click', () => this.changePage(1));

    root.querySelectorAll('.pdf-sign-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('.pdf-sign-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = (tab as HTMLElement).dataset.mode as SignMode;
        (root.querySelector('#pdfsg-draw-panel') as HTMLElement).style.display = mode === 'draw' ? '' : 'none';
        (root.querySelector('#pdfsg-type-panel') as HTMLElement).style.display = mode === 'type' ? '' : 'none';
        (root.querySelector('#pdfsg-upload-panel') as HTMLElement).style.display = mode === 'upload' ? '' : 'none';
      });
    });

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
      this.setSignature(this.drawCanvas.toDataURL('image/png'));
    });
    this.drawCanvas.addEventListener('pointerleave', () => { this.isDrawing = false; });

    root.querySelector('#pdfsg-clear-draw')?.addEventListener('click', () => {
      this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
      this.state.signatureDataUrl = null;
      this.sigPreview.style.display = 'none';
      this.sigPlaceholder.style.display = '';
      this.placeBtn.disabled = true;
    });

    root.querySelector('#pdfsg-type-apply')?.addEventListener('click', () => this.renderTypeSignature());
    this.typeInput.addEventListener('input', () => this.renderTypeSignature());

    this.uploadInput.addEventListener('change', () => {
      const file = this.uploadInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => this.setSignature(reader.result as string);
      reader.readAsDataURL(file);
    });

    this.setupDragAndResize();
    this.placeBtn.addEventListener('click', () => this.placeSignature());

    // Change File
    root.querySelector('#pdfsg-change')?.addEventListener('click', () => {
      this.cleanupProxy();
      this.state.file = null;
      this.state.pdfBytes = null;
      this.state.pdfDoc = null;
      this.state.signatureDataUrl = null;
      this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });

    db.getPreference('defaultSignature', null).then(sig => {
      if (sig) this.setSignature(sig as string);
    });
  }

  private updateDimsDisplay(): void {
    const dimsEl = this.containerEl.querySelector('#pdfsg-dims');
    if (dimsEl) dimsEl.textContent = `${Math.round(this.state.sigW)} × ${Math.round(this.state.sigH)} px`;
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.cleanupProxy();

    this.state.file = file;
    this.state.currentPage = 1;
    this.state.signatureDataUrl = null;
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

    this.updatePageNav();
    this.resetOverlay();

    try {
      this.state.pdfDocProxy = await pdfjsLib.getDocument({ data: this.state.pdfBytes.slice(0) }).promise;
      await this.renderPage(this.state.currentPage);
    } catch {
      Toast.error('Failed to render PDF');
    }

    this.state.loading = false;
  }

  private async changePage(delta: number): Promise<void> {
    const next = this.state.currentPage + delta;
    if (next < 1 || next > this.state.totalPages) return;

    this.state.currentPage = next;
    this.updatePageNav();
    this.resetOverlay();
    await this.renderPage(next);
  }

  private updatePageNav(): void {
    this.pageNumEl.textContent = String(this.state.currentPage);
    (this.containerEl.querySelector('#pdfsg-total') as HTMLSpanElement).textContent = String(this.state.totalPages);
    this.prevBtn.disabled = this.state.currentPage <= 1;
    this.nextBtn.disabled = this.state.currentPage >= this.state.totalPages;
  }

  private resetOverlay(): void {
    this.sigOverlay.style.left = '';
    this.sigOverlay.style.top = '';
    this.sigOverlay.style.right = '';
    this.sigOverlay.style.bottom = '';
    this.sigOverlay.style.width = this.state.sigW + 'px';
    this.sigOverlay.style.height = this.state.sigH + 'px';
    this.state.sigW = 150;
    this.state.sigH = 60;
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
    this.setSignature(canvas.toDataURL('image/png'));
  }

  private setSignature(dataUrl: string): void {
    this.state.signatureDataUrl = dataUrl;
    this.sigPreview.src = dataUrl;
    this.sigPreview.style.display = '';
    this.sigPlaceholder.style.display = 'none';
    this.placeBtn.disabled = false;
  }

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
      const target = e.target as HTMLElement;
      if (target.classList.contains('pdf-sig-handle')) return;
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

    this.sigOverlay.addEventListener('pointerup', () => { isDragging = false; });

    const handles = this.sigOverlay.querySelectorAll('.pdf-sig-handle');
    handles.forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
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

  private async placeSignature(): Promise<void> {
    if (!this.state.pdfDoc || !this.state.signatureDataUrl) return;
    this.placeBtn.disabled = true;
    this.placeBtn.textContent = 'Signing...';

    try {
      const sigResponse = await fetch(this.state.signatureDataUrl);
      const sigBytes = await sigResponse.arrayBuffer();
      const sigImage = await this.state.pdfDoc.embedPng(sigBytes);

      const pages = this.state.pdfDoc.getPages();
      const page = pages[this.state.currentPage - 1];
      const { width: pdfW, height: pdfH } = page.getSize();

      const canvasRect = this.previewCanvas.getBoundingClientRect();
      const overlayRect = this.sigOverlay.getBoundingClientRect();

      const scaleX = this.previewCanvas.width / canvasRect.width;
      const scaleY = this.previewCanvas.height / canvasRect.height;

      const overlayLeft = (overlayRect.left - canvasRect.left) * scaleX;
      const overlayTop = (overlayRect.top - canvasRect.top) * scaleY;
      const overlayW = this.state.sigW * scaleX;
      const overlayH = this.state.sigH * scaleY;

      const pdfX = overlayLeft * (pdfW / this.previewCanvas.width);
      const pdfY = pdfH - (overlayTop + overlayH) * (pdfH / this.previewCanvas.height);

      page.drawImage(sigImage, {
        x: pdfX,
        y: pdfY,
        width: this.state.sigW,
        height: this.state.sigH,
      });

      const pdfBytes = await this.state.pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const name = this.state.file!.name.replace(/\.pdf$/i, '-signed.pdf');
      downloadBlob(blob, name);
      Toast.success('PDF signed');
      logToolAction('pdf-sign', 'Signed PDF');
    } catch {
      Toast.error('Failed to sign PDF');
    }

    this.placeBtn.textContent = 'Sign & Download';
    this.placeBtn.disabled = false;
  }

  private cleanupProxy(): void {
    this.state.pdfDocProxy = null;
  }

  destroy(): void {
    this.cleanupProxy();
    this.state.pdfDoc = null;
    this.state.pdfBytes = null;
    this.state.file = null;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }
}
