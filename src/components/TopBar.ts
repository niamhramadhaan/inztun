import { router } from '../core/router';
import { events } from '../core/events';
import { db } from '../core/db';
import { ICONS } from '../core/icons';

interface Command {
  id: string;
  label: string;
  category: string;
  icon: string;
  action: (() => void) | null;
  isTool?: boolean;
}

const COMMANDS: Command[] = [
  { id: 'nav:home', label: 'Home', category: 'Modules', icon: ICONS.home, action: () => router.navigate('home') },
  { id: 'nav:workers-suite', label: "Worker's Suite", category: 'Modules', icon: ICONS.workers, action: () => router.navigate('workers-suite') },
  { id: 'nav:playground', label: "Playground", category: 'Modules', icon: ICONS.play, action: () => router.navigate('playground') },
  { id: 'nav:freelance-core', label: 'Freelance Core', category: 'Modules', icon: ICONS.freelance, action: () => router.navigate('freelance-core') },
  { id: 'nav:marketing-lab', label: 'Marketing Lab', category: 'Modules', icon: ICONS.marketing, action: () => router.navigate('marketing-lab') },
  { id: 'nav:design-studio', label: 'Design Studio', category: 'Modules', icon: ICONS.design, action: () => router.navigate('design-studio') },

  { id: 'tool:json-formatter', label: 'JSON Formatter', category: "Worker's Suite", icon: ICONS.json, action: () => router.navigate('workers-suite', 'json-formatter'), isTool: true },
  { id: 'tool:base64', label: 'Base64 Encoder/Decoder', category: "Worker's Suite", icon: ICONS.base64, action: () => router.navigate('workers-suite', 'base64'), isTool: true },
  { id: 'tool:hash-generator', label: 'Hash Generator', category: "Worker's Suite", icon: ICONS.hash, action: () => router.navigate('workers-suite', 'hash-generator'), isTool: true },
  { id: 'tool:uuid-generator', label: 'UUID Generator', category: "Worker's Suite", icon: ICONS.uuid, action: () => router.navigate('workers-suite', 'uuid-generator'), isTool: true },
  { id: 'tool:lorem-ipsum', label: 'Lorem Ipsum Generator', category: "Worker's Suite", icon: ICONS.lorem, action: () => router.navigate('workers-suite', 'lorem-ipsum'), isTool: true },
  { id: 'tool:typing-test', label: 'Typing Test', category: 'Playground', icon: ICONS.keyboard, action: () => router.navigate('playground', 'typing-test'), isTool: true },
  { id: 'tool:ascii-art', label: 'ASCII Art Generator', category: 'Playground', icon: ICONS.asciiArt, action: () => router.navigate('playground', 'ascii-art'), isTool: true },
  { id: 'tool:morse-code', label: 'Morse Code', category: 'Playground', icon: ICONS.morse, action: () => router.navigate('playground', 'morse-code'), isTool: true },
  { id: 'tool:css-gradient', label: 'CSS Gradient Builder', category: 'Design Studio', icon: ICONS.gradient, action: () => router.navigate('design-studio', 'css-gradient'), isTool: true },
  { id: 'tool:border-radius', label: 'Border Radius Previewer', category: 'Design Studio', icon: ICONS.borderRadius, action: () => router.navigate('design-studio', 'border-radius'), isTool: true },
  { id: 'tool:typography-scale', label: 'Typography Scale', category: 'Design Studio', icon: ICONS.typeScale, action: () => router.navigate('design-studio', 'typography-scale'), isTool: true },
  { id: 'tool:spacing-system', label: 'Spacing System', category: 'Design Studio', icon: ICONS.spacing, action: () => router.navigate('design-studio', 'spacing-system'), isTool: true },
  { id: 'tool:utm-builder', label: 'UTM Builder', category: 'Marketing Lab', icon: ICONS.utm, action: () => router.navigate('marketing-lab', 'utm-builder'), isTool: true },
  { id: 'tool:seo-meta', label: 'SEO Meta Generator', category: 'Marketing Lab', icon: ICONS.seo, action: () => router.navigate('marketing-lab', 'seo-meta'), isTool: true },
  { id: 'tool:social-counter', label: 'Social Media Counter', category: 'Marketing Lab', icon: ICONS.social, action: () => router.navigate('marketing-lab', 'social-counter'), isTool: true },
  { id: 'tool:color-palette', label: 'Color Palette Extractor', category: 'Marketing Lab', icon: ICONS.palette, action: () => router.navigate('marketing-lab', 'color-palette'), isTool: true },
  { id: 'tool:invoice-generator', label: 'Invoice Generator', category: 'Freelance Core', icon: ICONS.invoice, action: () => router.navigate('freelance-core', 'invoice-generator'), isTool: true },
  { id: 'tool:rate-calculator', label: 'Rate Calculator', category: 'Freelance Core', icon: ICONS.rate, action: () => router.navigate('freelance-core', 'rate-calculator'), isTool: true },
  { id: 'tool:time-tracker', label: 'Time Tracker', category: 'Freelance Core', icon: ICONS.timeTracker, action: () => router.navigate('freelance-core', 'time-tracker'), isTool: true },
  { id: 'tool:expense-tracker', label: 'Expense Tracker', category: 'Freelance Core', icon: ICONS.expense, action: () => router.navigate('freelance-core', 'expense-tracker'), isTool: true },
  { id: 'tool:contract-templates', label: 'Contract Templates', category: 'Freelance Core', icon: ICONS.contract, action: () => router.navigate('freelance-core', 'contract-templates'), isTool: true },
  { id: 'tool:client-manager', label: 'Client Manager', category: 'Freelance Core', icon: ICONS.clients, action: () => router.navigate('freelance-core', 'client-manager'), isTool: true },
  { id: 'settings:accent', label: 'Change Accent Color', category: 'Settings', icon: ICONS.settings, action: () => events.emit('palette:open-settings') },
];

export class TopBar {
  private container: HTMLElement;
  private input: HTMLInputElement | null = null;
  private resultsEl: HTMLDivElement | null = null;
  private wrapperEl: HTMLDivElement | null = null;
  private isOpen = false;
  private selectedIndex = 0;
  private filteredCommands: Command[] = [];
  private _outsideClick: ((e: MouseEvent) => void) | null = null;
  private usageCache: Record<string, number> = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.loadUsage();
  }

  private async loadUsage(): Promise<void> {
    this.usageCache = await db.getToolUsage();
  }

  private render(): void {
    this.addStyles();

    this.container.className = 'topbar';
    this.container.innerHTML = `
      <div class="topbar__inner">
        <a class="topbar__logo" href="#/" data-nav="home">inztun</a>
        <div class="topbar__search" id="topbar-search">
          ${ICONS.search}
          <input type="text" placeholder="Search... ⌘K" id="topbar-search-input" spellcheck="false" autocomplete="off">
        </div>
      </div>
      <div class="topbar__dropdown" id="topbar-dropdown"></div>
    `;

    this.input = this.container.querySelector('#topbar-search-input');
    this.resultsEl = this.container.querySelector('#topbar-dropdown');
    this.wrapperEl = this.container.querySelector('#topbar-search');
  }

  private bindEvents(): void {
    const logo = this.container.querySelector('.topbar__logo');
    logo?.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate('home');
    });

    this.input?.addEventListener('focus', () => this.open());
    this.input?.addEventListener('input', () => this.filter());

    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveSelection(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        this.input?.blur();
      }
    });

    this._outsideClick = (e: MouseEvent) => {
      if (!this.isOpen) return;
      const target = e.target as HTMLElement;
      if (!this.container.contains(target)) {
        this.close();
      }
    };
    document.addEventListener('mousedown', this._outsideClick);

    events.on('search:focus', () => {
      this.input?.focus();
      this.input?.select();
    });
  }

  private open(): void {
    this.isOpen = true;
    this.loadUsage().then(() => this.filter());
    this.wrapperEl?.classList.add('topbar__search--focused');
    this.resultsEl?.classList.add('topbar__dropdown--open');
  }

  private close(): void {
    this.isOpen = false;
    this.wrapperEl?.classList.remove('topbar__search--focused');
    this.resultsEl?.classList.remove('topbar__dropdown--open');
  }

  private filter(): void {
    const query = (this.input?.value || '').toLowerCase().trim();

    if (!query) {
      const tools = COMMANDS.filter(c => c.isTool);
      tools.sort((a, b) => (this.usageCache[b.id.replace('tool:', '')] || 0) - (this.usageCache[a.id.replace('tool:', '')] || 0));
      this.filteredCommands = tools.slice(0, 10);
    } else {
      this.filteredCommands = COMMANDS.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.category}`.toLowerCase();
        return this.fuzzyMatch(query, searchText);
      });
    }

    this.selectedIndex = 0;
    this.renderResults(query);
  }

  private fuzzyMatch(query: string, text: string): boolean {
    let qi = 0;
    for (let i = 0; i < text.length && qi < query.length; i++) {
      if (text[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  private highlightMatch(text: string, query: string): string {
    if (!query) return text;
    let result = '';
    let qi = 0;
    for (let i = 0; i < text.length; i++) {
      if (qi < query.length && text[i].toLowerCase() === query[qi].toLowerCase()) {
        result += `<mark>${text[i]}</mark>`;
        qi++;
      } else {
        result += text[i];
      }
    }
    return result;
  }

  private renderResults(query: string): void {
    if (!this.resultsEl) return;

    if (this.filteredCommands.length === 0) {
      this.resultsEl.innerHTML = `<div class="tbdd-empty">No results for "${query}"</div>`;
      return;
    }

    const grouped: Record<string, Command[]> = {};
    for (const cmd of this.filteredCommands) {
      const cat = query ? cmd.category : (cmd.isTool ? 'Frequently Used' : cmd.category);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(cmd);
    }

    let html = '';
    let globalIndex = 0;

    for (const [category, commands] of Object.entries(grouped)) {
      html += `<div class="tbdd-category">${category}</div>`;
      for (const cmd of commands) {
        const isSelected = globalIndex === this.selectedIndex;
        const toolId = cmd.id.replace('tool:', '');
        const count = this.usageCache[toolId];
        const meta = (!query && count) ? `<span class="tbdd-item__count">${count}×</span>` : '';
        html += `
          <div class="tbdd-item ${isSelected ? 'tbdd-item--selected' : ''}"
               data-index="${globalIndex}" data-id="${cmd.id}">
            <span class="tbdd-item__icon">${cmd.icon}</span>
            <span class="tbdd-item__label">${this.highlightMatch(cmd.label, query)}</span>
            ${meta}
          </div>
        `;
        globalIndex++;
      }
    }

    this.resultsEl.innerHTML = html;

    this.resultsEl.querySelectorAll('.tbdd-item').forEach(item => {
      item.addEventListener('click', () => {
        const cmdId = (item as HTMLElement).dataset.id;
        const cmd = this.filteredCommands.find(c => c.id === cmdId);
        if (cmd?.action) {
          this.close();
          cmd.action();
        }
      });

      item.addEventListener('mouseenter', () => {
        const index = parseInt((item as HTMLElement).dataset.index!);
        this.selectedIndex = index;
        this.updateSelection();
      });
    });
  }

  private moveSelection(delta: number): void {
    const maxIndex = this.filteredCommands.length - 1;
    let newIndex = this.selectedIndex + delta;
    if (newIndex < 0) newIndex = 0;
    if (newIndex > maxIndex) newIndex = maxIndex;
    this.selectedIndex = newIndex;
    this.updateSelection();
    this.scrollToSelected();
  }

  private updateSelection(): void {
    this.resultsEl?.querySelectorAll('.tbdd-item').forEach(item => {
      const index = parseInt((item as HTMLElement).dataset.index!);
      item.classList.toggle('tbdd-item--selected', index === this.selectedIndex);
    });
  }

  private scrollToSelected(): void {
    const selected = this.resultsEl?.querySelector('.tbdd-item--selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  private executeSelected(): void {
    const cmd = this.filteredCommands[this.selectedIndex];
    if (cmd?.action) {
      this.close();
      cmd.action();
    }
  }

  private addStyles(): void {
    if (document.getElementById('topbar-styles')) return;
    const style = document.createElement('style');
    style.id = 'topbar-styles';
    style.textContent = `
      .topbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(3, 3, 5, 0.85);
        backdrop-filter: blur(16px) saturate(1.2);
        -webkit-backdrop-filter: blur(16px) saturate(1.2);
        border-bottom: 1px solid var(--border-hairline);
      }
      .topbar__inner {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-6);
        max-width: 1400px;
        margin: 0 auto;
      }
      .topbar__logo {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        font-weight: 500;
        color: var(--text-primary);
        text-decoration: none;
        letter-spacing: 0.02em;
        transition: color 150ms ease;
        flex-shrink: 0;
      }
      .topbar__logo:hover {
        color: var(--accent);
      }
      .topbar__search {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-1) var(--space-3);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-pill);
        transition: border-color 150ms ease, box-shadow 150ms ease, min-width 200ms var(--ease-out);
        margin-left: auto;
        min-width: 200px;
      }
      .topbar__search:hover {
        border-color: var(--border-subtle);
      }
      .topbar__search--focused {
        border-color: var(--accent-border);
        box-shadow: 0 0 0 1px var(--accent-border), 0 0 20px rgba(201, 169, 110, 0.08);
        min-width: 320px;
      }
      .topbar__search svg {
        width: 14px;
        height: 14px;
        color: var(--text-muted);
        flex-shrink: 0;
      }
      .topbar__search--focused svg {
        color: var(--accent);
      }
      .topbar__search input {
        background: none;
        border: none;
        outline: none;
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        width: 100%;
        cursor: text;
      }
      .topbar__search input::placeholder {
        color: var(--text-ghost);
      }

      .topbar__dropdown {
        position: absolute;
        top: 100%;
        right: var(--space-6);
        width: 380px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-lg);
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.03),
          0 16px 48px rgba(0, 0, 0, 0.5);
        padding: var(--space-2);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 150ms ease, visibility 150ms ease, transform 150ms var(--ease-out);
        z-index: 110;
      }
      .topbar__dropdown--open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .tbdd-category {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-top: var(--space-1);
      }
      .tbdd-category:first-child {
        margin-top: 0;
      }

      .tbdd-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background 80ms ease;
      }
      .tbdd-item:hover,
      .tbdd-item--selected {
        background: var(--bg-glass-hover);
      }
      .tbdd-item--selected {
        background: var(--accent-dim);
      }

      .tbdd-item__icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        flex-shrink: 0;
      }
      .tbdd-item__icon svg {
        width: 14px;
        height: 14px;
      }

      .tbdd-item__label {
        flex: 1;
        font-size: var(--text-sm);
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tbdd-item__label mark {
        background: transparent;
        color: var(--accent);
        font-weight: 500;
      }

      .tbdd-item__count {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
        flex-shrink: 0;
      }

      .tbdd-empty {
        padding: var(--space-6);
        text-align: center;
        color: var(--text-muted);
        font-size: var(--text-sm);
      }

      @media (max-width: 768px) {
        .topbar__inner {
          padding: var(--space-2) var(--space-3);
        }
        .topbar__search {
          min-width: 120px;
        }
        .topbar__search--focused {
          min-width: 200px;
        }
        .topbar__dropdown {
          right: var(--space-3);
          width: calc(100vw - var(--space-6));
          max-width: 380px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .topbar__search,
        .topbar__dropdown {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    if (this._outsideClick) document.removeEventListener('mousedown', this._outsideClick);
  }
}
