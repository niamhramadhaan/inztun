import { db } from '../core/db';
import { Toast } from './Toast';
import { CURRENCIES } from './SettingsPanel';

const SIGN_FONTS = [
  "'Dancing Script', cursive",
  "'Great Vibes', cursive",
  "'Pacifico', cursive",
  "cursive",
];

const DPI_OPTIONS = [
  { label: '72 DPI (Screen)', value: 72 },
  { label: '96 DPI (Standard)', value: 96 },
  { label: '150 DPI (High)', value: 150 },
  { label: '300 DPI (Print)', value: 300 },
];

const EXPORT_SIZES = [
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
];

export class DefaultsPanel {
  private overlay: HTMLDivElement | null = null;
  private sigPreview: HTMLImageElement | null = null;
  private drawCanvas: HTMLCanvasElement | null = null;
  private drawCtx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private signatureDataUrl: string | null = null;

  constructor() {
    this.addStyles();
  }

  private addStyles(): void {
    if (document.getElementById('defaults-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'defaults-panel-styles';
    style.textContent = `
      .defaults-overlay {
        position: fixed; inset: 0; z-index: 300;
        display: flex; align-items: center; justify-content: center;
        padding: 4vh 0;
        background: rgba(3, 3, 5, 0.7);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        opacity: 0; visibility: hidden;
        transition: opacity 200ms ease, visibility 200ms ease;
      }
      .defaults-overlay--open { opacity: 1; visibility: visible; }
      .defaults-panel {
        width: 480px; max-width: 90vw; max-height: 88vh;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        overflow: hidden; display: flex; flex-direction: column;
        transform: translateY(-8px) scale(0.98);
        transition: transform 200ms var(--ease-out);
      }
      .defaults-overlay--open .defaults-panel { transform: translateY(0) scale(1); }
      .defaults-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--border-hairline); flex-shrink: 0;
      }
      .defaults-header__title {
        font-family: var(--font-display); font-size: var(--text-xl);
        color: var(--text-primary);
      }
      .defaults-close {
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        background: transparent; border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); color: var(--text-muted); cursor: pointer;
        transition: all 150ms ease;
      }
      .defaults-close:hover { background: var(--bg-glass); color: var(--text-primary); }
      .defaults-body { padding: var(--space-5); overflow-y: auto; flex: 1; }
      .defaults-section { margin-bottom: var(--space-5); }
      .defaults-section:last-child { margin-bottom: 0; }
      .defaults-label {
        font-size: var(--text-xs); font-weight: 600; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3);
      }
      .defaults-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
      .defaults-sig-preview {
        display: flex; align-items: center; justify-content: center;
        padding: var(--space-3); background: var(--bg-deep);
        border-radius: var(--radius-md); border: 1px solid var(--border-hairline);
        margin-bottom: var(--space-3); min-height: 60px;
      }
      .defaults-sig-preview img { max-width: 100%; max-height: 80px; }
      .defaults-sig-placeholder { font-size: var(--text-sm); color: var(--text-ghost); }
      .defaults-draw-canvas {
        width: 100%; height: 100px; border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); background: white; cursor: crosshair;
        touch-action: none; margin-bottom: var(--space-2);
      }
      .defaults-sig-actions { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); }
      .defaults-sig-tabs { display: flex; gap: var(--space-1); margin-bottom: var(--space-3); }
      .defaults-sig-tab.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
      .defaults-footer {
        padding: var(--space-3) var(--space-5);
        border-top: 1px solid var(--border-hairline);
        font-size: var(--text-xs); color: var(--text-ghost);
        text-align: center; flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
  }

  render(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'defaults-overlay';
    this.overlay.innerHTML = `
      <div class="defaults-panel">
        <div class="defaults-header">
          <h3 class="defaults-header__title">Defaults</h3>
          <button class="defaults-close" id="defaults-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="defaults-body">
          <div class="defaults-section">
            <div class="defaults-label">Business</div>
            <div class="form-group"><label class="label">Currency</label>
              <select class="input" id="defaults-currency">
                ${CURRENCIES.map(c => `<option value="${c.code}">${c.symbol} ${c.code} — ${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="label">Locale</label><input type="text" class="input" id="defaults-locale" placeholder="en-US"></div>
            <div class="form-group"><label class="label">Email</label><input type="email" class="input" id="defaults-email" placeholder="you@company.com"></div>
            <div class="form-group"><label class="label">Company</label><input type="text" class="input" id="defaults-company" placeholder="Your Company"></div>
            <div class="defaults-row-2col">
              <div class="form-group"><label class="label">Tax Rate %</label><input type="number" class="input" id="defaults-tax-rate" placeholder="0" min="0" max="100"></div>
              <div class="form-group"><label class="label">Payment Terms (days)</label><input type="number" class="input" id="defaults-payment-terms" placeholder="30" min="0"></div>
            </div>
          </div>

          <div class="defaults-section">
            <div class="defaults-label">Default Signature</div>
            <div class="defaults-sig-preview" id="defaults-sig-preview">
              <span class="defaults-sig-placeholder">No signature saved</span>
            </div>
            <div class="defaults-sig-tabs" id="defaults-sig-tabs">
              <button class="btn btn--ghost btn--sm defaults-sig-tab active" data-mode="draw">Draw</button>
              <button class="btn btn--ghost btn--sm defaults-sig-tab" data-mode="type">Type</button>
              <button class="btn btn--ghost btn--sm defaults-sig-tab" data-mode="upload">Upload</button>
            </div>
            <div id="defaults-draw-panel">
              <canvas id="defaults-draw-canvas" class="defaults-draw-canvas" width="400" height="100"></canvas>
            </div>
            <div id="defaults-type-panel" style="display:none;">
              <div class="defaults-row-2col" style="margin-bottom:var(--space-2);">
                <input type="text" class="input" id="defaults-type-input" placeholder="Type your name">
                <select class="input" id="defaults-type-font">
                  ${SIGN_FONTS.map(f => `<option value="${f}">${f.split(',')[0].replace(/'/g, '')}</option>`).join('')}
                </select>
              </div>
              <button class="btn btn--ghost btn--sm" id="defaults-type-apply">Apply</button>
            </div>
            <div id="defaults-upload-panel" style="display:none;">
              <input type="file" id="defaults-upload-input" accept="image/*">
            </div>
            <div class="defaults-sig-actions">
              <button class="btn btn--primary btn--sm" id="defaults-sig-save">Save Signature</button>
              <button class="btn btn--ghost btn--sm" id="defaults-sig-clear">Clear</button>
            </div>
          </div>

          <div class="defaults-section">
            <div class="defaults-label">Tool Defaults</div>
            <div class="defaults-row-2col">
              <div class="form-group"><label class="label">PDF to Images DPI</label>
                <select class="input" id="defaults-dpi">
                  ${DPI_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-group"><label class="label">Logo Export Size</label>
                <select class="input" id="defaults-export-size">
                  ${EXPORT_SIZES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="defaults-footer">
          Defaults pre-fill tool inputs — change per-use as needed
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Close
    this.overlay.querySelector('#defaults-close')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('defaults-overlay--open')) {
        e.preventDefault();
        this.close();
      }
    });

    // Business defaults
    const defaultsMap: [string, string, 'value'][] = [
      ['defaultCurrency', '#defaults-currency', 'value'],
      ['defaultLocale', '#defaults-locale', 'value'],
      ['defaultEmail', '#defaults-email', 'value'],
      ['defaultCompany', '#defaults-company', 'value'],
      ['defaultTaxRate', '#defaults-tax-rate', 'value'],
      ['defaultPaymentTerms', '#defaults-payment-terms', 'value'],
    ];

    defaultsMap.forEach(([key, selector, prop]) => {
      const el = this.overlay!.querySelector(selector) as HTMLInputElement;
      if (!el) return;
      db.getPreference(key, '').then(val => {
        if (val !== '' && val !== null && val !== undefined) (el as any)[prop] = val;
      });
      const save = () => {
        const raw = el.value.trim();
        if (key === 'defaultTaxRate' || key === 'defaultPaymentTerms') {
          db.setPreference(key, raw === '' ? '' : Number(raw));
        } else {
          db.setPreference(key, raw);
        }
      };
      el.addEventListener('input', save);
      el.addEventListener('change', save);
    });

    // Tool defaults
    const dpiSelect = this.overlay.querySelector('#defaults-dpi') as HTMLSelectElement;
    const exportSelect = this.overlay.querySelector('#defaults-export-size') as HTMLSelectElement;

    db.getPreference('defaultDpi', 150).then(val => { dpiSelect.value = String(val); });
    db.getPreference('defaultExportSize', 256).then(val => { exportSelect.value = String(val); });

    dpiSelect.addEventListener('change', () => db.setPreference('defaultDpi', parseInt(dpiSelect.value)));
    exportSelect.addEventListener('change', () => db.setPreference('defaultExportSize', parseInt(exportSelect.value)));

    // Signature
    this.sigPreview = this.overlay.querySelector('#defaults-sig-preview') as HTMLImageElement;
    this.drawCanvas = this.overlay.querySelector('#defaults-draw-canvas') as HTMLCanvasElement;
    this.drawCtx = this.drawCanvas.getContext('2d')!;
    this.drawCtx.strokeStyle = '#000';
    this.drawCtx.lineWidth = 2;
    this.drawCtx.lineCap = 'round';

    // Load saved signature
    db.getPreference('defaultSignature', null).then(sig => {
      if (sig) {
        this.signatureDataUrl = sig as string;
        this.showSigPreview(sig as string);
      }
    });

    // Draw events
    this.drawCanvas.addEventListener('pointerdown', (e) => {
      this.isDrawing = true;
      this.drawCtx!.beginPath();
      this.drawCtx!.moveTo(e.offsetX, e.offsetY);
    });
    this.drawCanvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      this.drawCtx!.lineTo(e.offsetX, e.offsetY);
      this.drawCtx!.stroke();
    });
    this.drawCanvas.addEventListener('pointerup', () => {
      this.isDrawing = false;
      this.signatureDataUrl = this.drawCanvas!.toDataURL('image/png');
      this.showSigPreview(this.signatureDataUrl);
    });
    this.drawCanvas.addEventListener('pointerleave', () => { this.isDrawing = false; });

    // Type signature
    const typeInput = this.overlay.querySelector('#defaults-type-input') as HTMLInputElement;
    const typeFont = this.overlay.querySelector('#defaults-type-font') as HTMLSelectElement;
    const typeApply = this.overlay.querySelector('#defaults-type-apply')!;

    const renderType = () => {
      const text = typeInput.value.trim();
      if (!text) return;
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.font = `36px ${typeFont.value}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 10, 50);
      this.signatureDataUrl = canvas.toDataURL('image/png');
      this.showSigPreview(this.signatureDataUrl);
    };

    typeApply.addEventListener('click', renderType);
    typeInput.addEventListener('input', renderType);

    // Upload signature
    const uploadInput = this.overlay.querySelector('#defaults-upload-input') as HTMLInputElement;
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.signatureDataUrl = reader.result as string;
        this.showSigPreview(this.signatureDataUrl);
      };
      reader.readAsDataURL(file);
    });

    // Tab switching
    this.overlay.querySelectorAll('.defaults-sig-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.overlay!.querySelectorAll('.defaults-sig-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = (tab as HTMLElement).dataset.mode;
        (this.overlay!.querySelector('#defaults-draw-panel') as HTMLElement).style.display = mode === 'draw' ? '' : 'none';
        (this.overlay!.querySelector('#defaults-type-panel') as HTMLElement).style.display = mode === 'type' ? '' : 'none';
        (this.overlay!.querySelector('#defaults-upload-panel') as HTMLElement).style.display = mode === 'upload' ? '' : 'none';
      });
    });

    // Save signature
    this.overlay.querySelector('#defaults-sig-save')?.addEventListener('click', async () => {
      if (!this.signatureDataUrl) {
        Toast.error('Draw, type, or upload a signature first');
        return;
      }
      await db.setPreference('defaultSignature', this.signatureDataUrl);
      Toast.success('Default signature saved');
    });

    // Clear signature
    this.overlay.querySelector('#defaults-sig-clear')?.addEventListener('click', async () => {
      this.signatureDataUrl = null;
      this.drawCtx!.clearRect(0, 0, this.drawCanvas!.width, this.drawCanvas!.height);
      this.sigPreview!.innerHTML = '<span class="defaults-sig-placeholder">No signature saved</span>';
      this.sigPreview!.querySelector('img')?.remove();
      await db.setPreference('defaultSignature', null);
      Toast.info('Signature cleared');
    });
  }

  private showSigPreview(dataUrl: string): void {
    if (!this.sigPreview) return;
    this.sigPreview.innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:80px;">`;
  }

  open(): void {
    if (!this.overlay) this.render();
    this.overlay!.classList.add('defaults-overlay--open');
  }

  close(): void {
    this.overlay?.classList.remove('defaults-overlay--open');
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
