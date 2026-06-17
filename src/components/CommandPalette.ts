import { router } from '../core/router';
import { events } from '../core/events';
import { db } from '../core/db';
import { ICONS } from '../core/icons';

export const PALETTE_EVENTS = {
  OPEN_SETTINGS: 'palette:open-settings',
} as const;

interface Command {
  id: string;
  label: string;
  category: string;
  icon: string;
  action: (() => void) | null;
  disabled?: boolean;
  isTool?: boolean;
  moduleKey?: string;
}

const MODULE_COMMANDS: Command[] = [
  { id: 'nav:home', label: 'Home', category: 'Modules', icon: ICONS.home, action: () => router.navigate('home') },
  { id: 'nav:workers-suite', label: "Worker's Suite", category: 'Modules', icon: ICONS.workers, action: () => router.navigate('workers-suite'), moduleKey: 'workers-suite' },
  { id: 'nav:playground', label: "Playground", category: 'Modules', icon: ICONS.play, action: () => router.navigate('playground'), moduleKey: 'playground' },
  { id: 'nav:freelance-core', label: 'Freelance Core', category: 'Modules', icon: ICONS.freelance, action: () => router.navigate('freelance-core'), moduleKey: 'freelance-core' },
  { id: 'nav:marketing-lab', label: 'Marketing Lab', category: 'Modules', icon: ICONS.marketing, action: () => router.navigate('marketing-lab'), moduleKey: 'marketing-lab' },
  { id: 'nav:design-studio', label: 'Design Studio', category: 'Modules', icon: ICONS.design, action: () => router.navigate('design-studio'), moduleKey: 'design-studio' },
];

const TOOL_COMMANDS: Command[] = [
  { id: 'tool:json-formatter', label: 'JSON Formatter', category: "Worker's Suite", icon: ICONS.json, action: () => router.navigate('workers-suite', 'json-formatter'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:base64', label: 'Base64 Encoder/Decoder', category: "Worker's Suite", icon: ICONS.base64, action: () => router.navigate('workers-suite', 'base64'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:hash-generator', label: 'Hash Generator', category: "Worker's Suite", icon: ICONS.hash, action: () => router.navigate('workers-suite', 'hash-generator'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:uuid-generator', label: 'UUID Generator', category: "Worker's Suite", icon: ICONS.uuid, action: () => router.navigate('workers-suite', 'uuid-generator'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:lorem-ipsum', label: 'Lorem Ipsum Generator', category: "Worker's Suite", icon: ICONS.lorem, action: () => router.navigate('workers-suite', 'lorem-ipsum'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:scratchpad', label: 'Scratchpad', category: "Worker's Suite", icon: ICONS.scratchpad, action: () => router.navigate('workers-suite', 'scratchpad'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-merge', label: 'PDF Merger', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-merge'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-split', label: 'PDF Splitter', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-split'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-compress', label: 'PDF Compressor', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-compress'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-protect', label: 'PDF Password Protection', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-protect'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-sign', label: 'PDF Signature', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-sign'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-to-images', label: 'PDF to Images', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-to-images'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:pdf-metadata', label: 'PDF Metadata Editor', category: "Worker's Suite", icon: ICONS.pdf, action: () => router.navigate('workers-suite', 'pdf-metadata'), isTool: true, moduleKey: 'workers-suite' },
  { id: 'tool:typing-test', label: 'Typing Test', category: 'Playground', icon: ICONS.keyboard, action: () => router.navigate('playground', 'typing-test'), isTool: true, moduleKey: 'playground' },
  { id: 'tool:banner-generator', label: 'Banner Generator', category: 'Playground', icon: ICONS.asciiArt, action: () => router.navigate('playground', 'banner-generator'), isTool: true, moduleKey: 'playground' },
  { id: 'tool:css-gradient', label: 'CSS Gradient Builder', category: 'Design Studio', icon: ICONS.gradient, action: () => router.navigate('design-studio', 'css-gradient'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:border-radius', label: 'Border Radius Previewer', category: 'Design Studio', icon: ICONS.borderRadius, action: () => router.navigate('design-studio', 'border-radius'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:typography-scale', label: 'Typography Scale', category: 'Design Studio', icon: ICONS.typeScale, action: () => router.navigate('design-studio', 'typography-scale'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:spacing-system', label: 'Spacing System', category: 'Design Studio', icon: ICONS.spacing, action: () => router.navigate('design-studio', 'spacing-system'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:logo-builder', label: 'Logo Builder', category: 'Design Studio', icon: ICONS.logoBuilder, action: () => router.navigate('design-studio', 'logo-builder'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:image-crop', label: 'Image Cropper', category: 'Design Studio', icon: ICONS.imageCrop, action: () => router.navigate('design-studio', 'image-crop'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:image-filters', label: 'Image Filters', category: 'Design Studio', icon: ICONS.imageFilters, action: () => router.navigate('design-studio', 'image-filters'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:image-metadata', label: 'Image Metadata', category: 'Design Studio', icon: ICONS.imageMetadata, action: () => router.navigate('design-studio', 'image-metadata'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:font-pairer', label: 'Font Pairer', category: 'Design Studio', icon: ICONS.fontPairer, action: () => router.navigate('design-studio', 'font-pairer'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:brand-kit', label: 'Brand Kit', category: 'Design Studio', icon: ICONS.brandKit, action: () => router.navigate('design-studio', 'brand-kit'), isTool: true, moduleKey: 'design-studio' },
  { id: 'tool:utm-builder', label: 'UTM Builder', category: 'Marketing Lab', icon: ICONS.utm, action: () => router.navigate('marketing-lab', 'utm-builder'), isTool: true, moduleKey: 'marketing-lab' },
  { id: 'tool:seo-meta', label: 'SEO Meta Generator', category: 'Marketing Lab', icon: ICONS.seo, action: () => router.navigate('marketing-lab', 'seo-meta'), isTool: true, moduleKey: 'marketing-lab' },
  { id: 'tool:social-counter', label: 'Social Media Counter', category: 'Marketing Lab', icon: ICONS.social, action: () => router.navigate('marketing-lab', 'social-counter'), isTool: true, moduleKey: 'marketing-lab' },
  { id: 'tool:color-palette', label: 'Color Palette Extractor', category: 'Marketing Lab', icon: ICONS.palette, action: () => router.navigate('marketing-lab', 'color-palette'), isTool: true, moduleKey: 'marketing-lab' },
  { id: 'tool:invoice-generator', label: 'Invoice Generator', category: 'Freelance Core', icon: ICONS.invoice, action: () => router.navigate('freelance-core', 'invoice-generator'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:rate-calculator', label: 'Rate Calculator', category: 'Freelance Core', icon: ICONS.rate, action: () => router.navigate('freelance-core', 'rate-calculator'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:time-tracker', label: 'Time Tracker', category: 'Freelance Core', icon: ICONS.timeTracker, action: () => router.navigate('freelance-core', 'time-tracker'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:expense-tracker', label: 'Expense Tracker', category: 'Freelance Core', icon: ICONS.expense, action: () => router.navigate('freelance-core', 'expense-tracker'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:contract-templates', label: 'Contract Templates', category: 'Freelance Core', icon: ICONS.contract, action: () => router.navigate('freelance-core', 'contract-templates'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:client-manager', label: 'Client Manager', category: 'Freelance Core', icon: ICONS.clients, action: () => router.navigate('freelance-core', 'client-manager'), isTool: true, moduleKey: 'freelance-core' },
  { id: 'tool:project-manager', label: 'Projects', category: 'Freelance Core', icon: ICONS.projects, action: () => router.navigate('freelance-core', 'project-manager'), isTool: true, moduleKey: 'freelance-core' },
];

const ALL_COMMANDS: Command[] = [
  { id: 'settings:accent', label: 'Settings', category: 'Settings', icon: ICONS.settings, action: () => events.emit(PALETTE_EVENTS.OPEN_SETTINGS) },
  { id: 'settings:defaults', label: 'Defaults', category: 'Settings', icon: ICONS.defaults, action: () => events.emit('palette:open-defaults') },
  { id: 'help:shortcuts', label: 'Keyboard Shortcuts', category: 'Help', icon: ICONS.settings, action: () => events.emit('shortcuts:open') },
  ...MODULE_COMMANDS,
  ...TOOL_COMMANDS,
];

const MODULE_ORDER = ['workers-suite', 'playground', 'design-studio', 'marketing-lab', 'freelance-core'];

export class CommandPalette {
  private isOpen = false;
  private selectedIndex = 0;
  private filteredCommands: Command[] = [];
  private overlay: HTMLDivElement | null = null;
  private input: HTMLInputElement | null = null;
  private resultsList: HTMLDivElement | null = null;
  private usageCache: Record<string, number> = {};
  private expandedModules = new Set<string>();
  private moduleViewData: Array<{ module: Command; tools: Command[] }> = [];

  constructor() {
    this.addStyles();
    this.bindKeyboard();
    events.on('palette:open', () => this.open());
  }

  private async loadUsage(): Promise<void> {
    this.usageCache = await db.getToolUsage();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .cmd-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 20vh;
        background: rgba(3, 3, 5, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 200ms ease, visibility 200ms ease;
      }

      .cmd-overlay--open {
        opacity: 1;
        visibility: visible;
      }

      .cmd-palette {
        width: 560px;
        max-width: 90vw;
        max-height: 480px;
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-xl);
        box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.03),
          0 24px 80px rgba(0, 0, 0, 0.6),
          0 0 60px rgba(201, 169, 110, 0.05);
        overflow: hidden;
        transform: translateY(-8px) scale(0.98);
        transition: transform 200ms var(--ease-out);
      }

      .cmd-overlay--open .cmd-palette {
        transform: translateY(0) scale(1);
      }

      .cmd-input-wrapper {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--border-hairline);
      }

      .cmd-input-icon {
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .cmd-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-family: var(--font-mono);
        font-size: var(--text-base);
        color: var(--text-primary);
        caret-color: var(--accent);
      }

      .cmd-input::placeholder {
        color: var(--text-ghost);
      }

      .cmd-kbd {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--text-muted);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        flex-shrink: 0;
      }

      .cmd-results {
        max-height: 380px;
        overflow-y: auto;
        padding: var(--space-2);
      }

      .cmd-category {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .cmd-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background 100ms ease;
      }

      .cmd-item:hover,
      .cmd-item--selected {
        background: var(--bg-glass-hover);
      }

      .cmd-item--selected {
        background: var(--accent-dim);
      }

      .cmd-item--disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .cmd-item__icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        flex-shrink: 0;
      }
      .cmd-item__icon svg {
        width: 16px;
        height: 16px;
      }

      .cmd-item__label {
        flex: 1;
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .cmd-item__label mark {
        background: transparent;
        color: var(--accent);
        font-weight: 500;
      }

      .cmd-item__meta {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
        flex-shrink: 0;
      }

      .cmd-item__kbd {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }

      .cmd-empty {
        padding: var(--space-8);
        text-align: center;
        color: var(--text-muted);
        font-size: var(--text-sm);
      }

      .cmd-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-4);
        border-top: 1px solid var(--border-hairline);
        font-size: var(--text-xs);
        color: var(--text-ghost);
      }

      .cmd-footer__hints {
        display: flex;
        gap: var(--space-3);
      }

      .cmd-footer__hint {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      @media (prefers-reduced-motion: reduce) {
        .cmd-overlay,
        .cmd-palette,
        .cmd-item,
        .cmd-module__children {
          transition: none !important;
          animation: none !important;
        }
      }

      .cmd-module {
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .cmd-module__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        border-radius: var(--radius-md);
        transition: background 100ms ease;
        user-select: none;
      }

      .cmd-module__header:hover,
      .cmd-module__header--selected {
        background: var(--bg-glass-hover);
      }

      .cmd-module__header--selected {
        background: var(--accent-dim);
      }

      .cmd-module__header-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        flex-shrink: 0;
      }

      .cmd-module__header-icon svg {
        width: 14px;
        height: 14px;
      }

      .cmd-module__header-label {
        flex: 1;
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
      }

      .cmd-module__header-count {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
        flex-shrink: 0;
      }

      .cmd-module__header-chevron {
        width: 14px;
        height: 14px;
        color: var(--text-ghost);
        transition: transform 200ms ease;
        flex-shrink: 0;
      }

      .cmd-module--expanded .cmd-module__header-chevron {
        transform: rotate(180deg);
      }

      .cmd-module__children {
        display: none;
        padding-left: var(--space-4);
        border-left: 1px solid var(--border-hairline);
        margin-left: var(--space-5);
        margin-bottom: var(--space-1);
      }

      .cmd-module--expanded .cmd-module__children {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  private bindKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }

      if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveSelection(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveSelection(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });
  }

  render(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cmd-overlay';
    this.overlay.innerHTML = `
      <div class="cmd-palette">
        <div class="cmd-input-wrapper">
          <svg class="cmd-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="cmd-input" type="text" placeholder="Search modules, tools, actions..." spellcheck="false" autocomplete="off">
          <span class="cmd-kbd">ESC</span>
        </div>
        <div class="cmd-results"></div>
        <div class="cmd-footer">
          <div class="cmd-footer__hints">
            <span class="cmd-footer__hint"><span class="cmd-kbd">↑↓</span> navigate</span>
            <span class="cmd-footer__hint"><span class="cmd-kbd">↵</span> select</span>
            <span class="cmd-footer__hint"><span class="cmd-kbd">esc</span> close</span>
          </div>
          <span>inztun</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.input = this.overlay.querySelector('.cmd-input');
    this.resultsList = this.overlay.querySelector('.cmd-results');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.input?.addEventListener('input', () => this.filter());
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (!this.overlay) this.render();
    this.isOpen = true;
    this.overlay!.classList.add('cmd-overlay--open');
    this.input!.value = '';

    this.loadUsage().then(() => {
      this.determineDefaultExpanded();
      this.filter();
    });

    requestAnimationFrame(() => {
      this.input?.focus();
    });
  }

  private determineDefaultExpanded(): void {
    if (this.expandedModules.size > 0) return;

    let bestModule = MODULE_ORDER[0];
    let bestScore = 0;

    for (const modKey of MODULE_ORDER) {
      const tools = TOOL_COMMANDS.filter(c => c.moduleKey === modKey);
      let score = 0;
      for (const t of tools) {
        const id = t.id.replace('tool:', '');
        score += this.usageCache[id] || 0;
      }
      if (score > bestScore) {
        bestScore = score;
        bestModule = modKey;
      }
    }

    this.expandedModules.add(bestModule);
  }

  close(): void {
    this.isOpen = false;
    this.overlay?.classList.remove('cmd-overlay--open');
    this.input?.blur();
  }

  private filter(): void {
    const query = this.input!.value.toLowerCase().trim();

    if (!query) {
      this.moduleViewData = this.buildModuleView();
      this.filteredCommands = this.flattenModuleView();
    } else {
      this.moduleViewData = [];
      this.filteredCommands = ALL_COMMANDS.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.category}`.toLowerCase();
        return this.fuzzyMatch(query, searchText);
      });
    }

    this.selectedIndex = 0;
    this.renderResults(query);
  }

  private buildModuleView(): Array<{ module: Command; tools: Command[] }> {
    const result: Array<{ module: Command; tools: Command[] }> = [];

    for (const modKey of MODULE_ORDER) {
      const modCmd = MODULE_COMMANDS.find(c => c.moduleKey === modKey);
      if (!modCmd) continue;

      const tools = TOOL_COMMANDS
        .filter(c => c.moduleKey === modKey)
        .sort((a, b) => {
          const aId = a.id.replace('tool:', '');
          const bId = b.id.replace('tool:', '');
          return (this.usageCache[bId] || 0) - (this.usageCache[aId] || 0);
        });

      result.push({ module: modCmd, tools });
    }

    return result;
  }

  private flattenModuleView(): Command[] {
    const result: Command[] = [];
    result.push(MODULE_COMMANDS[0]);

    for (const { module, tools } of this.moduleViewData) {
      result.push(module);
      if (this.expandedModules.has(module.moduleKey!)) {
        result.push(...tools);
      }
    }

    result.push(ALL_COMMANDS[ALL_COMMANDS.length - 2]);
    result.push(ALL_COMMANDS[ALL_COMMANDS.length - 1]);

    return result;
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
    if (!query && this.moduleViewData.length > 0) {
      this.renderAccordion();
      return;
    }

    if (this.filteredCommands.length === 0) {
      this.resultsList!.innerHTML = `<div class="cmd-empty">No results for "${query}"</div>`;
      return;
    }

    const grouped: Record<string, Command[]> = {};
    for (const cmd of this.filteredCommands) {
      if (!grouped[cmd.category]) grouped[cmd.category] = [];
      grouped[cmd.category].push(cmd);
    }

    let html = '';
    let globalIndex = 0;

    for (const [category, commands] of Object.entries(grouped)) {
      html += `<div class="cmd-category">${category}</div>`;
      for (const cmd of commands) {
        const isSelected = globalIndex === this.selectedIndex;
        const isDisabled = cmd.disabled;
        const toolId = cmd.id.replace('tool:', '');
        const count = this.usageCache[toolId];
        const meta = (!query && count && cmd.isTool) ? `<span class="cmd-item__meta">${count}×</span>` : '';
        html += `
          <div class="cmd-item ${isSelected ? 'cmd-item--selected' : ''} ${isDisabled ? 'cmd-item--disabled' : ''}" 
               data-index="${globalIndex}" 
               data-id="${cmd.id}">
            <span class="cmd-item__icon">${cmd.icon}</span>
            <span class="cmd-item__label">${this.highlightMatch(cmd.label, query)}</span>
            ${meta}
            ${isDisabled ? '<span class="cmd-item__kbd">Soon</span>' : ''}
          </div>
        `;
        globalIndex++;
      }
    }

    this.resultsList!.innerHTML = html;
    this.bindResultItems();
  }

  private renderAccordion(): void {
    let html = '';
    let globalIndex = 0;

    // Home item
    const homeCmd = MODULE_COMMANDS[0];
    const isHomeSelected = globalIndex === this.selectedIndex;
    html += `
      <div class="cmd-item ${isHomeSelected ? 'cmd-item--selected' : ''}" data-index="${globalIndex}" data-id="${homeCmd.id}">
        <span class="cmd-item__icon">${homeCmd.icon}</span>
        <span class="cmd-item__label">${homeCmd.label}</span>
      </div>
    `;
    globalIndex++;

    for (const { module, tools } of this.moduleViewData) {
      const isExpanded = this.expandedModules.has(module.moduleKey!);
      const isSelected = globalIndex === this.selectedIndex;

      html += `<div class="cmd-module ${isExpanded ? 'cmd-module--expanded' : ''}" data-module="${module.moduleKey}">`;
      html += `
        <div class="cmd-module__header ${isSelected ? 'cmd-module__header--selected' : ''}" data-index="${globalIndex}" data-id="${module.id}">
          <span class="cmd-module__header-icon">${module.icon}</span>
          <span class="cmd-module__header-label">${module.label}</span>
          <span class="cmd-module__header-count">${tools.length}</span>
          <svg class="cmd-module__header-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      `;
      globalIndex++;

      html += `<div class="cmd-module__children">`;
      for (const cmd of tools) {
        const isChildSelected = globalIndex === this.selectedIndex;
        const toolId = cmd.id.replace('tool:', '');
        const count = this.usageCache[toolId];
        const meta = count ? `<span class="cmd-item__meta">${count}×</span>` : '';
        html += `
          <div class="cmd-item ${isChildSelected ? 'cmd-item--selected' : ''}" data-index="${globalIndex}" data-id="${cmd.id}">
            <span class="cmd-item__icon">${cmd.icon}</span>
            <span class="cmd-item__label">${cmd.label}</span>
            ${meta}
          </div>
        `;
        globalIndex++;
      }
      html += `</div>`;
      html += `</div>`;
    }

    // Settings and Shortcuts
    for (const cmd of ALL_COMMANDS.filter(c => c.id === 'settings:accent' || c.id === 'help:shortcuts')) {
      const isSelected = globalIndex === this.selectedIndex;
      html += `
        <div class="cmd-item ${isSelected ? 'cmd-item--selected' : ''}" data-index="${globalIndex}" data-id="${cmd.id}">
          <span class="cmd-item__icon">${cmd.icon}</span>
          <span class="cmd-item__label">${cmd.label}</span>
        </div>
      `;
      globalIndex++;
    }

    this.resultsList!.innerHTML = html;
    this.bindAccordionEvents();
    this.bindResultItems();
  }

  private bindAccordionEvents(): void {
    this.resultsList!.querySelectorAll('.cmd-module__header').forEach(header => {
      header.addEventListener('click', () => {
        const modKey = (header.closest('.cmd-module') as HTMLElement)?.dataset.module;
        if (!modKey) return;

        if (this.expandedModules.has(modKey)) {
          this.expandedModules.delete(modKey);
        } else {
          this.expandedModules.add(modKey);
        }

        this.filter();
      });
    });
  }

  private bindResultItems(): void {
    this.resultsList!.querySelectorAll('.cmd-item:not(.cmd-item--disabled)').forEach(item => {
      item.addEventListener('click', () => {
        const cmdId = (item as HTMLElement).dataset.id;
        const cmd = this.filteredCommands.find(c => c.id === cmdId)
          || MODULE_COMMANDS.find(c => c.id === cmdId)
          || ALL_COMMANDS.find(c => c.id === cmdId);
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
    const isAccordion = this.moduleViewData.length > 0 && !(this.input?.value.trim());

    if (isAccordion) {
      const visibleIndices = this.getVisibleIndices();
      const currentPos = visibleIndices.indexOf(this.selectedIndex);
      if (currentPos < 0) {
        this.selectedIndex = visibleIndices[0] ?? 0;
      } else {
        const newPos = Math.max(0, Math.min(visibleIndices.length - 1, currentPos + delta));
        this.selectedIndex = visibleIndices[newPos];
      }
    } else {
      let newIndex = this.selectedIndex + delta;
      while (newIndex >= 0 && newIndex <= maxIndex && this.filteredCommands[newIndex]?.disabled) {
        newIndex += delta;
      }
      if (newIndex >= 0 && newIndex <= maxIndex) {
        this.selectedIndex = newIndex;
      }
    }

    this.updateSelection();
    this.scrollToSelected();
  }

  private getVisibleIndices(): number[] {
    const indices: number[] = [];
    const items = this.resultsList!.querySelectorAll('.cmd-item, .cmd-module__header');
    items.forEach(el => {
      if (el.closest('.cmd-module__children') && !el.closest('.cmd-module--expanded')) return;
      const idx = parseInt((el as HTMLElement).dataset.index!);
      if (!isNaN(idx)) indices.push(idx);
    });
    return indices;
  }

  private updateSelection(): void {
    this.resultsList!.querySelectorAll('.cmd-item, .cmd-module__header').forEach((item) => {
      const index = parseInt((item as HTMLElement).dataset.index!);
      const isSelected = index === this.selectedIndex;
      item.classList.toggle('cmd-item--selected', isSelected && item.classList.contains('cmd-item'));
      item.classList.toggle('cmd-module__header--selected', isSelected && item.classList.contains('cmd-module__header'));
    });
  }

  private scrollToSelected(): void {
    const selected = this.resultsList!.querySelector('.cmd-item--selected, .cmd-module__header--selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  private executeSelected(): void {
    const isAccordion = this.moduleViewData.length > 0 && !(this.input?.value.trim());

    if (isAccordion) {
      const selectedEl = this.resultsList!.querySelector(`[data-index="${this.selectedIndex}"]`) as HTMLElement;
      if (!selectedEl) return;

      if (selectedEl.classList.contains('cmd-module__header')) {
        const modKey = selectedEl.closest('.cmd-module')?.getAttribute('data-module');
        if (modKey) {
          if (this.expandedModules.has(modKey)) {
            this.expandedModules.delete(modKey);
          } else {
            this.expandedModules.add(modKey);
          }
          this.filter();
        }
        return;
      }

      const cmdId = selectedEl.dataset.id;
      const cmd = ALL_COMMANDS.find(c => c.id === cmdId);
      if (cmd && !cmd.disabled && cmd.action) {
        this.close();
        cmd.action();
      }
      return;
    }

    const cmd = this.filteredCommands[this.selectedIndex];
    if (cmd && !cmd.disabled && cmd.action) {
      this.close();
      cmd.action();
    }
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
