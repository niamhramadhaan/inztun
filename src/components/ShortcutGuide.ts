import { events } from '../core/events';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ keys: string; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: 'Ctrl + K', description: 'Open command palette' },
      { keys: 'ESC', description: 'Close palette / Back to grid' },
      { keys: '?', description: 'Open this shortcut guide' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: '/', description: 'Focus module search bar' },
      { keys: 'Alt + ↑', description: 'Previous tool in module' },
      { keys: 'Alt + ↓', description: 'Next tool in module' },
    ],
  },
  {
    title: 'Tool Actions',
    shortcuts: [
      { keys: 'Ctrl + Enter', description: 'Execute primary action' },
      { keys: 'Ctrl + Shift + C', description: 'Copy tool output' },
    ],
  },
  {
    title: 'Command Palette',
    shortcuts: [
      { keys: '↑ ↓', description: 'Navigate results' },
      { keys: 'Enter', description: 'Execute selected' },
      { keys: 'ESC', description: 'Close palette' },
    ],
  },
];

export class ShortcutGuide {
  private overlay: HTMLDivElement | null = null;
  private isOpen = false;

  constructor() {
    this.addStyles();
    events.on('shortcuts:open', () => this.open());
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .sg-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 15vh;
        background: rgba(3, 3, 5, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 200ms ease, visibility 200ms ease;
      }
      .sg-overlay--open {
        opacity: 1;
        visibility: visible;
      }
      .sg-panel {
        width: 480px;
        max-width: 90vw;
        max-height: 70vh;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        transform: translateY(-8px) scale(0.98);
        transition: transform 200ms var(--ease-out);
      }
      .sg-overlay--open .sg-panel {
        transform: translateY(0) scale(1);
      }
      .sg-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--border-hairline);
      }
      .sg-header__title {
        font-family: var(--font-display);
        font-size: var(--text-lg);
        color: var(--text-primary);
      }
      .sg-header__kbd {
        padding: 2px 6px;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--text-muted);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .sg-body {
        padding: var(--space-4) var(--space-5);
        overflow-y: auto;
        max-height: calc(70vh - 60px);
      }
      .sg-group {
        margin-bottom: var(--space-4);
      }
      .sg-group:last-child {
        margin-bottom: 0;
      }
      .sg-group__title {
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--space-2);
      }
      .sg-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-1) 0;
      }
      .sg-row__keys {
        display: flex;
        gap: var(--space-1);
      }
      .sg-key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        padding: 2px 6px;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--text-secondary);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
      }
      .sg-row__desc {
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }
      @media (prefers-reduced-motion: reduce) {
        .sg-overlay, .sg-panel { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  render(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'sg-overlay';

    let bodyHtml = '';
    for (const group of SHORTCUT_GROUPS) {
      bodyHtml += `<div class="sg-group"><div class="sg-group__title">${group.title}</div>`;
      for (const s of group.shortcuts) {
        const keys = s.keys
          .split('+')
          .map((k) => `<span class="sg-key">${k.trim()}</span>`)
          .join('');
        bodyHtml += `<div class="sg-row"><span class="sg-row__desc">${s.description}</span><span class="sg-row__keys">${keys}</span></div>`;
      }
      bodyHtml += '</div>';
    }

    this.overlay.innerHTML = `
      <div class="sg-panel">
        <div class="sg-header">
          <span class="sg-header__title">Keyboard Shortcuts</span>
          <span class="sg-header__kbd">ESC</span>
        </div>
        <div class="sg-body">${bodyHtml}</div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.overlay.querySelector('.sg-header__kbd')?.addEventListener('click', () => this.close());
  }

  open(): void {
    if (!this.overlay) this.render();
    this.isOpen = true;
    this.overlay!.classList.add('sg-overlay--open');
  }

  close(): void {
    this.isOpen = false;
    this.overlay?.classList.remove('sg-overlay--open');
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
