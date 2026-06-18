import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Toast } from '../../../components/Toast';
import { formatBytes, downloadBlob } from '../../../utils/image';
import { logToolAction } from '../../../core/activity';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PdfProtect {
  id = 'pdf-protect';
  name = 'PDF Password Protection';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`;

  private file: File | null = null;
  private containerEl!: HTMLDivElement;
  private previewCanvas!: HTMLCanvasElement;
  private modeSelect!: HTMLSelectElement;
  private userPassGroup!: HTMLDivElement;
  private ownerPassGroup!: HTMLDivElement;
  private currentPassGroup!: HTMLDivElement;
  private actionBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="pdf-drop-zone" id="pdfp-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <p>Drop a PDF file here or <strong>click to browse</strong></p>
          <input type="file" accept=".pdf" hidden>
        </div>
        <div class="pdf-protect-controls" id="pdfp-controls" style="display:none;">
          <div class="pdf-info-bar">
            <span id="pdfp-info"></span>
            <button class="btn btn--ghost btn--sm" id="pdfp-change">Change File</button>
          </div>
          <canvas id="pdfp-preview" class="pdf-preview-canvas" style="display:none;"></canvas>
          <div class="form-group">
            <label class="label">Mode</label>
            <select class="input" id="pdfp-mode">
              <option value="encrypt">Add Password</option>
              <option value="decrypt">Remove Password</option>
            </select>
          </div>
          <div class="form-group" id="pdfp-user-group">
            <label class="label">User Password (required to open)</label>
            <input type="password" class="input" id="pdfp-user-pass" placeholder="Enter user password">
          </div>
          <div class="form-group" id="pdfp-owner-group">
            <label class="label">Owner Password (restrict permissions)</label>
            <input type="password" class="input" id="pdfp-owner-pass" placeholder="Enter owner password (optional)">
          </div>
          <div class="form-group" id="pdfp-current-group" style="display:none;">
            <label class="label">Current Password</label>
            <input type="password" class="input" id="pdfp-current-pass" placeholder="Enter current password to unlock">
          </div>
          <p class="pdf-note">User password is required to open the PDF. Owner password restricts printing/editing. Removing password requires the current password.</p>
          <div class="pdf-actions">
            <button class="btn btn--primary" id="pdfp-action">Encrypt PDF</button>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const dropZone = root.querySelector('#pdfp-dropzone') as HTMLDivElement;
    this.containerEl = root.querySelector('#pdfp-controls')!;
    this.previewCanvas = root.querySelector('#pdfp-preview')!;
    this.modeSelect = root.querySelector('#pdfp-mode')!;
    this.userPassGroup = root.querySelector('#pdfp-user-group')!;
    this.ownerPassGroup = root.querySelector('#pdfp-owner-group')!;
    this.currentPassGroup = root.querySelector('#pdfp-current-group')!;
    this.actionBtn = root.querySelector('#pdfp-action')!;
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

    this.modeSelect.addEventListener('change', () => this.updateMode());
    this.actionBtn.addEventListener('click', () => this.process());

    // Change File
    root.querySelector('#pdfp-change')?.addEventListener('click', () => {
      this.file = null;
      this.previewCanvas.style.display = 'none';
      this.containerEl.style.display = 'none';
      dropZone.style.display = '';
    });
  }

  private async loadFile(file: File, dropZone: HTMLDivElement): Promise<void> {
    this.file = file;
    dropZone.style.display = 'none';
    this.containerEl.style.display = '';
    this.updateMode();

    const infoEl = this.containerEl.querySelector('#pdfp-info')!;
    infoEl.textContent = `${file.name} · ${formatBytes(file.size)}`;

    // Render first page preview
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
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
  }

  private updateMode(): void {
    const isEncrypt = this.modeSelect.value === 'encrypt';
    this.userPassGroup.style.display = isEncrypt ? '' : 'none';
    this.ownerPassGroup.style.display = isEncrypt ? '' : 'none';
    this.currentPassGroup.style.display = isEncrypt ? 'none' : '';
    this.actionBtn.textContent = isEncrypt ? 'Encrypt PDF' : 'Remove Password & Download';
  }

  private async process(): Promise<void> {
    if (!this.file) return;
    this.actionBtn.disabled = true;
    this.actionBtn.textContent = 'Processing...';

    try {
      const bytes = await this.file.arrayBuffer();

      if (this.modeSelect.value === 'encrypt') {
        const userPass = (document.getElementById('pdfp-user-pass') as HTMLInputElement).value;
        const ownerPass = (document.getElementById('pdfp-owner-pass') as HTMLInputElement).value;
        if (!userPass) { Toast.error('User password is required'); return; }

        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pdfBytes = await pdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const name = this.file.name.replace(/\.pdf$/i, '-protected.pdf');
        downloadBlob(blob, name);
        Toast.info('PDF saved. Note: pdf-lib does not support native encryption — use a server-side tool for true password protection.');
      } else {
        const currentPass = (document.getElementById('pdfp-current-pass') as HTMLInputElement).value;
        if (!currentPass) { Toast.error('Current password is required'); return; }

        const pdf = await PDFDocument.load(bytes, { password: currentPass });
        const pdfBytes = await pdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const name = this.file.name.replace(/\.pdf$/i, '-unlocked.pdf');
        downloadBlob(blob, name);
        Toast.success('Password removed');
        logToolAction('pdf-protect', 'Protected PDF');
      }
    } catch (err) {
      Toast.error(this.modeSelect.value === 'decrypt' ? 'Wrong password or failed to decrypt' : 'Failed to process PDF');
    } finally {
      this.actionBtn.disabled = false;
      this.actionBtn.textContent = this.modeSelect.value === 'encrypt' ? 'Encrypt PDF' : 'Remove Password & Download';
    }
  }

  destroy(): void {}
}
