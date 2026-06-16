import { db } from '../core/db';
import { Toast } from './Toast';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || '$';
}

const ACCENT_PRESETS = [
  { name: 'Gold', hex: '#c9a96e', rgb: '201, 169, 110' },
  { name: 'Silver', hex: '#8a8a9a', rgb: '138, 138, 154' },
  { name: 'Emerald', hex: '#4ade80', rgb: '74, 222, 128' },
  { name: 'Sapphire', hex: '#60a5fa', rgb: '96, 165, 250' },
  { name: 'Ruby', hex: '#f87171', rgb: '248, 113, 113' },
  { name: 'Amethyst', hex: '#a78bfa', rgb: '167, 139, 250' },
];

export class SettingsPanel {
  private overlay: HTMLDivElement | null = null;

  constructor() {
    this.addStyles();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .settings-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4vh 0;
        background: rgba(3, 3, 5, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 200ms ease, visibility 200ms ease;
      }

      .settings-overlay--open {
        opacity: 1;
        visibility: visible;
      }

      .settings-panel {
        width: 420px;
        max-width: 90vw;
        max-height: 88vh;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: translateY(-8px) scale(0.98);
        transition: transform 200ms var(--ease-out);
      }

      .settings-overlay--open .settings-panel {
        transform: translateY(0) scale(1);
      }

      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--border-hairline);
        flex-shrink: 0;
      }

      .settings-header__title {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        color: var(--text-primary);
      }

      .settings-close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        color: var(--text-muted);
        cursor: pointer;
        transition: all 150ms ease;
      }

      .settings-close:hover {
        background: var(--bg-glass);
        color: var(--text-primary);
      }

      .settings-body {
        padding: var(--space-5);
        overflow-y: auto;
        flex: 1;
      }

      .settings-section {
        margin-bottom: var(--space-5);
      }

      .settings-section:last-child {
        margin-bottom: 0;
      }

      .settings-label {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--space-3);
      }

      .accent-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-2);
      }

      .accent-option {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 150ms ease;
      }

      .accent-option:hover {
        background: var(--bg-glass-hover);
        border-color: var(--border-subtle);
      }

      .accent-option--active {
        border-color: var(--accent);
        background: var(--accent-dim);
      }

      .accent-swatch {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .accent-name {
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .custom-accent {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-3);
      }

      .custom-accent__input {
        flex: 1;
      }

      .settings-footer {
        padding: var(--space-3) var(--space-5);
        border-top: 1px solid var(--border-hairline);
        font-size: var(--text-xs);
        color: var(--text-ghost);
        text-align: center;
        flex-shrink: 0;
      }

      .settings-data-actions {
        display: flex;
        gap: var(--space-2);
      }

      .settings-data-actions .btn {
        flex: 1;
      }

      .settings-row-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }
    `;
    document.head.appendChild(style);
  }

  render(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';
    this.overlay.innerHTML = `
      <div class="settings-panel">
        <div class="settings-header">
          <h3 class="settings-header__title">Settings</h3>
          <button class="settings-close" id="settings-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="settings-body">
          <div class="settings-section">
            <div class="settings-label">Profile</div>
            <div class="form-group"><label class="label">Your Name</label><input type="text" class="input" id="settings-name" placeholder="What should we call you?"></div>
          </div>
          <div class="settings-section">
            <div class="settings-label">Defaults</div>
            <div class="form-group"><label class="label">Currency</label>
              <select class="input" id="settings-currency">
                ${CURRENCIES.map(c => `<option value="${c.code}">${c.symbol} ${c.code} — ${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="label">Locale</label><input type="text" class="input" id="settings-locale" placeholder="en-US"></div>
            <div class="form-group"><label class="label">Email</label><input type="email" class="input" id="settings-email" placeholder="you@company.com"></div>
            <div class="form-group"><label class="label">Company</label><input type="text" class="input" id="settings-company" placeholder="Your Company"></div>
            <div class="settings-row-2col">
              <div class="form-group"><label class="label">Tax Rate %</label><input type="number" class="input" id="settings-tax-rate" placeholder="0" min="0" max="100"></div>
              <div class="form-group"><label class="label">Payment Terms (days)</label><input type="number" class="input" id="settings-payment-terms" placeholder="30" min="0"></div>
            </div>
          </div>
          <div class="settings-section">
            <div class="settings-label">Accent Color</div>
            <div class="accent-grid" id="accent-grid">
              ${ACCENT_PRESETS.map(p => `
                <div class="accent-option" data-hex="${p.hex}" data-rgb="${p.rgb}">
                  <span class="accent-swatch" style="background: ${p.hex};"></span>
                  <span class="accent-name">${p.name}</span>
                </div>
              `).join('')}
            </div>
            <div class="custom-accent">
              <input class="input custom-accent__input" id="custom-hex" type="text" placeholder="#c9a96e" maxlength="7">
              <button class="btn btn--primary" id="custom-apply">Apply</button>
            </div>
          </div>
          <div class="settings-section">
            <div class="settings-label">Data</div>
            <div class="settings-data-actions">
              <button class="btn btn--primary" id="settings-export">Export Backup</button>
              <button class="btn btn--ghost" id="settings-import">Import</button>
            </div>
            <input type="file" id="settings-import-file" accept=".json" style="display:none">
          </div>
          <div class="settings-section" id="settings-install-section" style="display:none">
            <div class="settings-label">App</div>
            <button class="btn btn--primary" id="settings-install" style="width:100%">Install App</button>
          </div>
        </div>
        <div class="settings-footer">
          Settings persist in your browser via IndexedDB
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Load saved name
    db.getPreference('userName', '').then(name => {
      const nameInput = this.overlay!.querySelector('#settings-name') as HTMLInputElement;
      if (nameInput && name) nameInput.value = name;
    });

    // Save name on change
    const nameInput = this.overlay.querySelector('#settings-name') as HTMLInputElement;
    nameInput.addEventListener('input', () => {
      db.setPreference('userName', nameInput.value.trim());
    });

    // Load and save defaults
    const defaultsMap: [string, string, 'value' | 'checked'][] = [
      ['defaultCurrency', '#settings-currency', 'value'],
      ['defaultLocale', '#settings-locale', 'value'],
      ['defaultEmail', '#settings-email', 'value'],
      ['defaultCompany', '#settings-company', 'value'],
      ['defaultTaxRate', '#settings-tax-rate', 'value'],
      ['defaultPaymentTerms', '#settings-payment-terms', 'value'],
    ];

    defaultsMap.forEach(([key, selector, prop]) => {
      const el = this.overlay!.querySelector(selector) as HTMLInputElement;
      if (!el) return;
      db.getPreference(key, '').then(val => {
        if (val !== '' && val !== null && val !== undefined) (el as any)[prop] = val;
      });
      el.addEventListener('input', () => {
        const raw = el.value.trim();
        if (key === 'defaultTaxRate' || key === 'defaultPaymentTerms') {
          db.setPreference(key, raw === '' ? '' : Number(raw));
        } else {
          db.setPreference(key, raw);
        }
      });
      el.addEventListener('change', () => {
        const raw = el.value.trim();
        if (key === 'defaultTaxRate' || key === 'defaultPaymentTerms') {
          db.setPreference(key, raw === '' ? '' : Number(raw));
        } else {
          db.setPreference(key, raw);
        }
      });
    });

    this.overlay.querySelector('#settings-close')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('settings-overlay--open')) {
        e.preventDefault();
        this.close();
      }
    });

    this.overlay.querySelectorAll('.accent-option').forEach(option => {
      option.addEventListener('click', () => {
        const hex = (option as HTMLElement).dataset.hex;
        const rgb = (option as HTMLElement).dataset.rgb;
        this.applyAccent(hex!, rgb!);
        this.overlay!.querySelectorAll('.accent-option').forEach(o => o.classList.remove('accent-option--active'));
        option.classList.add('accent-option--active');
      });
    });

    this.overlay.querySelector('#custom-apply')?.addEventListener('click', () => {
      const hex = (this.overlay!.querySelector('#custom-hex') as HTMLInputElement).value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        this.applyAccent(hex, `${r}, ${g}, ${b}`);
      }
    });

    this.overlay.querySelector('#settings-export')?.addEventListener('click', async () => {
      const json = await db.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `inztun-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('Backup downloaded');
    });

    const fileInput = this.overlay.querySelector('#settings-import-file') as HTMLInputElement;
    this.overlay.querySelector('#settings-import')?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await db.importAll(text);
        Toast.success('Data restored — reloading');
        setTimeout(() => location.reload(), 800);
      } catch {
        Toast.error('Invalid backup file');
      }
    });

    // PWA install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      const section = this.overlay!.querySelector('#settings-install-section') as HTMLElement;
      if (section) section.style.display = '';
    });
    this.overlay.querySelector('#settings-install')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') Toast.success('App installed');
      deferredPrompt = null;
      const section = this.overlay!.querySelector('#settings-install-section') as HTMLElement;
      if (section) section.style.display = 'none';
    });
  }

  private applyAccent(hex: string, rgb: string): void {
    const root = document.documentElement;
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-dim', `rgba(${rgb}, 0.15)`);
    root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.08)`);
    root.style.setProperty('--accent-border', `rgba(${rgb}, 0.3)`);
    db.setPreference('accent', { hex, rgb });
  }

  open(): void {
    if (!this.overlay) this.render();
    this.overlay!.classList.add('settings-overlay--open');

    const current = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    this.overlay!.querySelectorAll('.accent-option').forEach(option => {
      option.classList.toggle('accent-option--active', (option as HTMLElement).dataset.hex === current);
    });
  }

  close(): void {
    this.overlay?.classList.remove('settings-overlay--open');
  }

  destroy(): void {
    this.overlay?.remove();
  }
}
