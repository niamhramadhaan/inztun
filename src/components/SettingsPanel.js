import { db } from '../core/db.js';

const ACCENT_PRESETS = [
  { name: 'Gold', hex: '#c9a96e', rgb: '201, 169, 110' },
  { name: 'Silver', hex: '#8a8a9a', rgb: '138, 138, 154' },
  { name: 'Emerald', hex: '#4ade80', rgb: '74, 222, 128' },
  { name: 'Sapphire', hex: '#60a5fa', rgb: '96, 165, 250' },
  { name: 'Ruby', hex: '#f87171', rgb: '248, 113, 113' },
  { name: 'Amethyst', hex: '#a78bfa', rgb: '167, 139, 250' },
];

export class SettingsPanel {
  constructor() {
    this.overlay = null;
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .settings-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 18vh;
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
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        overflow: hidden;
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
      }
    `;
    document.head.appendChild(style);
  }

  render() {
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
        </div>
        <div class="settings-footer">
          Settings persist in your browser via IndexedDB
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Close handlers
    this.overlay.querySelector('#settings-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('settings-overlay--open')) {
        e.preventDefault();
        this.close();
      }
    });

    // Accent preset clicks
    this.overlay.querySelectorAll('.accent-option').forEach(option => {
      option.addEventListener('click', () => {
        const hex = option.dataset.hex;
        const rgb = option.dataset.rgb;
        this.applyAccent(hex, rgb);
        this.overlay.querySelectorAll('.accent-option').forEach(o => o.classList.remove('accent-option--active'));
        option.classList.add('accent-option--active');
      });
    });

    // Custom hex
    this.overlay.querySelector('#custom-apply').addEventListener('click', () => {
      const hex = this.overlay.querySelector('#custom-hex').value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        this.applyAccent(hex, `${r}, ${g}, ${b}`);
      }
    });
  }

  applyAccent(hex, rgb) {
    const root = document.documentElement;
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-dim', `rgba(${rgb}, 0.15)`);
    root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.08)`);
    root.style.setProperty('--accent-border', `rgba(${rgb}, 0.3)`);
    db.setPreference('accent', { hex, rgb });
  }

  open() {
    if (!this.overlay) this.render();
    this.overlay.classList.add('settings-overlay--open');

    // Highlight current accent
    const current = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    this.overlay.querySelectorAll('.accent-option').forEach(option => {
      option.classList.toggle('accent-option--active', option.dataset.hex === current);
    });
  }

  close() {
    this.overlay?.classList.remove('settings-overlay--open');
  }

  destroy() {
    this.overlay?.remove();
  }
}
