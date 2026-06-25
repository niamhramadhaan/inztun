import type { Activity } from '../core/db';
import { db } from '../core/db';
import { router } from '../core/router';
import { escapeHtml } from '../utils/image';
import { Toast } from './Toast';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'tool-action', label: 'Tools' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'client-add', label: 'Clients' },
  { key: 'client-update', label: 'Clients' },
  { key: 'project-create', label: 'Projects' },
  { key: 'project-update', label: 'Projects' },
  { key: 'note-create', label: 'Notes' },
];

const ACTIVITY_ICONS: Record<string, string> = {
  invoice:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  'client-add':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>',
  'client-update':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>',
  'note-create':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  'project-create':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  'project-update':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
  'tool-action':
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
};

const TOOL_MODULE_MAP: Record<string, string> = {};
const wsTools = [
  'pdf-merge',
  'pdf-split',
  'pdf-compress',
  'pdf-sign',
  'pdf-metadata',
  'lorem-ipsum',
  'char-counter',
  'base64',
  'url-encoder',
  'json-formatter',
  'hash-generator',
  'uuid-generator',
  'password-generator',
  'css-unit',
  'markdown-preview',
  'markdown-html',
  'scratchpad',
  'qr-generator',
  'md-table',
  'chart-creator',
];
const dsTools = [
  'css-gradient',
  'border-radius',
  'typography-scale',
  'spacing-system',
  'image-compress',
  'image-resize',
  'image-convert',
  'contrast-checker',
  'favicon-generator',
  'logo-builder',
  'image-crop',
  'image-filters',
  'image-metadata',
  'font-pairer',
  'brand-guidelines',
];
const mlTools = [
  'utm-builder',
  'social-resizer',
  'social-counter',
  'seo-meta',
  'og-preview',
  'color-palette',
  'brand-extractor',
  'social-scheduler',
];
const fcTools = [
  'invoice-generator',
  'time-tracker',
  'rate-calculator',
  'contract-templates',
  'expense-tracker',
  'client-manager',
  'tax-estimator',
  'timezone-converter',
];
wsTools.forEach((t) => (TOOL_MODULE_MAP[t] = 'workers-suite'));
dsTools.forEach((t) => (TOOL_MODULE_MAP[t] = 'design-studio'));
mlTools.forEach((t) => (TOOL_MODULE_MAP[t] = 'marketing-lab'));
fcTools.forEach((t) => (TOOL_MODULE_MAP[t] = 'freelance-core'));

export class ActivityLog {
  private overlay: HTMLDivElement | null = null;
  private listEl: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private activities: Activity[] = [];
  private activeFilter = 'all';
  private searchQuery = '';

  constructor() {
    this.addStyles();
  }

  private addStyles(): void {
    if (document.getElementById('activity-log-styles')) return;
    const style = document.createElement('style');
    style.id = 'activity-log-styles';
    style.textContent = `
      .al-overlay {
        position: fixed; inset: 0; z-index: 300;
        display: flex; align-items: center; justify-content: center;
        padding: 4vh 0;
        background: rgba(3, 3, 5, 0.7);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        opacity: 0; visibility: hidden;
        transition: opacity 200ms ease, visibility 200ms ease;
      }
      .al-overlay--open { opacity: 1; visibility: visible; }
      .al-panel {
        width: 560px; max-width: 90vw; max-height: 85vh;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        overflow: hidden; display: flex; flex-direction: column;
        transform: translateY(-8px) scale(0.98);
        transition: transform 200ms var(--ease-out);
      }
      .al-overlay--open .al-panel { transform: translateY(0) scale(1); }
      .al-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--border-hairline); flex-shrink: 0;
      }
      .al-header__title {
        font-family: var(--font-display); font-size: var(--text-xl);
        color: var(--text-primary);
      }
      .al-header__actions { display: flex; gap: var(--space-2); align-items: center; }
      .al-close {
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        background: transparent; border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); color: var(--text-muted); cursor: pointer;
        transition: all 150ms ease;
      }
      .al-close:hover { background: var(--bg-glass); color: var(--text-primary); }
      .al-toolbar {
        display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-5);
        border-bottom: 1px solid var(--border-hairline); flex-shrink: 0;
        align-items: center; flex-wrap: wrap;
      }
      .al-search {
        flex: 1; min-width: 160px; padding: var(--space-2) var(--space-3);
        background: var(--bg-deep); border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); color: var(--text-primary);
        font-size: var(--text-sm); outline: none;
      }
      .al-search:focus { border-color: var(--accent); }
      .al-filters { display: flex; gap: var(--space-1); flex-wrap: wrap; }
      .al-filter-btn {
        padding: var(--space-1) var(--space-3); border-radius: var(--radius-pill);
        background: transparent; border: 1px solid var(--border-hairline);
        color: var(--text-muted); font-size: var(--text-xs); cursor: pointer;
        transition: all 150ms ease;
      }
      .al-filter-btn:hover { color: var(--text-secondary); border-color: var(--text-muted); }
      .al-filter-btn--active {
        background: var(--accent-dim); border-color: var(--accent-border);
        color: var(--accent);
      }
      .al-body { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }
      .al-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: var(--space-3);
        padding: var(--space-8); color: var(--text-muted); text-align: center;
      }
      .al-empty svg { opacity: 0.3; }
      .al-item {
        display: flex; align-items: center; gap: var(--space-3);
        padding: var(--space-2) var(--space-5);
        cursor: pointer; transition: background 100ms ease;
      }
      .al-item:hover { background: var(--bg-glass); }
      .al-item__icon {
        width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
        background: var(--bg-deep); border-radius: var(--radius-md);
        color: var(--text-muted); flex-shrink: 0;
      }
      .al-item__body { flex: 1; min-width: 0; }
      .al-item__label {
        font-size: var(--text-sm); color: var(--text-primary);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .al-item__meta {
        font-size: var(--text-xs); color: var(--text-ghost);
        font-family: var(--font-mono);
      }
      .al-item__time {
        font-size: var(--text-xs); color: var(--text-ghost);
        font-family: var(--font-mono); flex-shrink: 0;
      }
      .al-footer {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--space-3) var(--space-5);
        border-top: 1px solid var(--border-hairline); flex-shrink: 0;
      }
      .al-count { font-size: var(--text-xs); color: var(--text-ghost); font-family: var(--font-mono); }
    `;
    document.head.appendChild(style);
  }

  render(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'al-overlay';
    this.overlay.innerHTML = `
      <div class="al-panel">
        <div class="al-header">
          <span class="al-header__title">Activity Log</span>
          <div class="al-header__actions">
            <button class="btn btn--ghost btn--sm" id="al-clear">Clear All</button>
            <button class="al-close" id="al-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="al-toolbar">
          <input type="text" class="al-search" id="al-search" placeholder="Search activity...">
          <div class="al-filters" id="al-filters">
            ${TYPE_FILTERS.map(
              (f) => `
              <button class="al-filter-btn ${f.key === 'all' ? 'al-filter-btn--active' : ''}" data-filter="${f.key}">${f.label}</button>
            `,
            ).join('')}
          </div>
        </div>
        <div class="al-body" id="al-body"></div>
        <div class="al-footer">
          <span class="al-count" id="al-count">0 items</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.listEl = this.overlay.querySelector('#al-body')!;
    this.searchInput = this.overlay.querySelector('#al-search')!;

    this.overlay.querySelector('#al-close')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('al-overlay--open')) this.close();
    });

    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput!.value.toLowerCase();
      this.renderList();
    });

    this.overlay.querySelectorAll('.al-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.overlay!.querySelectorAll('.al-filter-btn').forEach((b) =>
          b.classList.remove('al-filter-btn--active'),
        );
        btn.classList.add('al-filter-btn--active');
        this.activeFilter = (btn as HTMLElement).dataset.filter!;
        this.renderList();
      });
    });

    this.overlay.querySelector('#al-clear')?.addEventListener('click', async () => {
      if (!confirm('Clear all activity? This cannot be undone.')) return;
      await db.clearActivity();
      this.activities = [];
      this.renderList();
      Toast.info('Activity log cleared');
    });
  }

  private renderList(): void {
    if (!this.listEl) return;

    let filtered = this.activities;

    if (this.activeFilter !== 'all') {
      if (this.activeFilter === 'client-add') {
        filtered = filtered.filter((a) => a.type === 'client-add' || a.type === 'client-update');
      } else if (this.activeFilter === 'project-create') {
        filtered = filtered.filter(
          (a) => a.type === 'project-create' || a.type === 'project-update',
        );
      } else {
        filtered = filtered.filter((a) => a.type === this.activeFilter);
      }
    }

    if (this.searchQuery) {
      filtered = filtered.filter((a) => a.label.toLowerCase().includes(this.searchQuery));
    }

    const countEl = this.overlay!.querySelector('#al-count')!;
    countEl.textContent = `${filtered.length} of ${this.activities.length} items`;

    if (filtered.length === 0) {
      this.listEl.innerHTML = `
        <div class="al-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>No activity found</p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = filtered
      .map(
        (a) => `
      <div class="al-item" data-type="${a.type}" data-meta="${a.meta || ''}">
        <span class="al-item__icon">${ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS['tool-action']}</span>
        <span class="al-item__body">
          <span class="al-item__label">${escapeHtml(a.label)}</span>
          ${a.meta ? `<span class="al-item__meta">${escapeHtml(a.meta)}</span>` : ''}
        </span>
        <span class="al-item__time">${this.relativeTime(a.createdAt)}</span>
      </div>
    `,
      )
      .join('');

    this.listEl.querySelectorAll('.al-item').forEach((item) => {
      item.addEventListener('click', () => {
        const type = (item as HTMLElement).dataset.type || '';
        const meta = (item as HTMLElement).dataset.meta || '';
        this.navigateToActivity(type, meta);
        this.close();
      });
    });
  }

  private navigateToActivity(type: string, meta: string): void {
    switch (type) {
      case 'invoice':
        router.navigate('freelance-core', 'invoice-generator');
        break;
      case 'client-add':
      case 'client-update':
        router.navigate('freelance-core', 'client-manager');
        break;
      case 'project-create':
      case 'project-update':
        router.navigate('freelance-core', 'client-manager');
        break;
      case 'note-create':
        router.navigate('workers-suite', 'scratchpad');
        break;
      case 'tool-action': {
        const toolId = meta;
        const mod = TOOL_MODULE_MAP[toolId];
        if (mod) router.navigate(mod, toolId);
        break;
      }
    }
  }

  private relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  async open(): Promise<void> {
    this.render();
    this.activities = await db.getAllActivity();
    this.activeFilter = 'all';
    this.searchQuery = '';
    if (this.searchInput) this.searchInput.value = '';
    this.overlay!.querySelectorAll('.al-filter-btn').forEach((b) => {
      b.classList.toggle('al-filter-btn--active', (b as HTMLElement).dataset.filter === 'all');
    });
    this.renderList();
    requestAnimationFrame(() => this.overlay!.classList.add('al-overlay--open'));
  }

  close(): void {
    this.overlay?.classList.remove('al-overlay--open');
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
