import { Tile } from '../../components/Tile';
import { ToolView } from '../../components/ToolView';
import { router, ROUTES } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { ICONS } from '../../core/icons';
import type { Tool, ToolClass, ToolRegistryEntry, ToolViewOptions } from '../../types/index';

import { JsonFormatter } from '../workers-suite/tools/json-formatter';
import { Base64Tool } from '../workers-suite/tools/base64';
import { HashGenerator } from '../workers-suite/tools/hash-generator';
import { UuidGenerator } from '../workers-suite/tools/uuid-generator';
import { LoremIpsum } from '../workers-suite/tools/lorem-ipsum';
import { CharacterCounter } from '../workers-suite/tools/char-counter';
import { UrlEncoder } from '../workers-suite/tools/url-encoder';
import { MarkdownPreview } from '../workers-suite/tools/markdown-preview';
import { MarkdownToHtml } from '../workers-suite/tools/markdown-html';
import { PasswordGenerator } from '../workers-suite/tools/password-gen';
import { CssUnitConverter } from '../workers-suite/tools/css-unit';
import { TypingTest } from '../playground/tools/typing-test';
import { MorseCode } from '../playground/tools/morse-code';
import { AsciiArt } from '../playground/tools/ascii-art';
import { PixelArt } from '../playground/tools/pixel-art';
import { CssGradient } from '../design-studio/tools/css-gradient';
import { BorderRadius } from '../design-studio/tools/border-radius';
import { TypographyScale } from '../design-studio/tools/typography-scale';
import { SpacingSystem } from '../design-studio/tools/spacing-system';
import { ImageCompress } from '../design-studio/tools/image-compress';
import { ImageResize } from '../design-studio/tools/image-resize';
import { ImageConvert } from '../design-studio/tools/image-convert';
import { ContrastChecker } from '../design-studio/tools/contrast-checker';
import { FaviconGenerator } from '../design-studio/tools/favicon-generator';
import { UtmBuilder } from '../marketing-lab/tools/utm-builder';
import { SeoMeta } from '../marketing-lab/tools/seo-meta';
import { SocialCounter } from '../marketing-lab/tools/social-counter';
import { ColorPalette } from '../marketing-lab/tools/color-palette';
import { OgPreview } from '../marketing-lab/tools/og-preview';
import { SocialResizer } from '../marketing-lab/tools/social-resizer';
import { InvoiceGenerator } from '../freelance-core/tools/invoice-generator';
import { RateCalculator } from '../freelance-core/tools/rate-calculator';
import { TimeTracker } from '../freelance-core/tools/time-tracker';
import { ExpenseTracker } from '../freelance-core/tools/expense-tracker';
import { ContractTemplates } from '../freelance-core/tools/contract-templates';
import { ClientManager } from '../freelance-core/tools/client-manager';
import { TaxEstimator } from '../freelance-core/tools/tax-estimator';
import { TimezoneConverter } from '../freelance-core/tools/timezone-converter';

const ALL_TOOLS: Record<string, { Tool: ToolClass; module: string; name: string }> = {
  'json-formatter': { Tool: JsonFormatter, module: 'workers-suite', name: 'JSON Formatter' },
  'base64': { Tool: Base64Tool, module: 'workers-suite', name: 'Base64' },
  'hash-generator': { Tool: HashGenerator, module: 'workers-suite', name: 'Hash Generator' },
  'uuid-generator': { Tool: UuidGenerator, module: 'workers-suite', name: 'UUID Generator' },
  'lorem-ipsum': { Tool: LoremIpsum, module: 'workers-suite', name: 'Lorem Ipsum' },
  'char-counter': { Tool: CharacterCounter, module: 'workers-suite', name: 'Char Counter' },
  'url-encoder': { Tool: UrlEncoder, module: 'workers-suite', name: 'URL Encoder' },
  'markdown-preview': { Tool: MarkdownPreview, module: 'workers-suite', name: 'MD Preview' },
  'markdown-html': { Tool: MarkdownToHtml, module: 'workers-suite', name: 'MD→HTML' },
  'password-gen': { Tool: PasswordGenerator, module: 'workers-suite', name: 'Password Gen' },
  'css-unit': { Tool: CssUnitConverter, module: 'workers-suite', name: 'CSS Unit' },
  'typing-test': { Tool: TypingTest, module: 'playground', name: 'Typing Test' },
  'ascii-art': { Tool: AsciiArt, module: 'playground', name: 'ASCII Art' },
  'morse-code': { Tool: MorseCode, module: 'playground', name: 'Morse Code' },
  'pixel-art': { Tool: PixelArt, module: 'playground', name: 'Pixel Art' },
  'css-gradient': { Tool: CssGradient, module: 'design-studio', name: 'CSS Gradient' },
  'border-radius': { Tool: BorderRadius, module: 'design-studio', name: 'Border Radius' },
  'typography-scale': { Tool: TypographyScale, module: 'design-studio', name: 'Type Scale' },
  'spacing-system': { Tool: SpacingSystem, module: 'design-studio', name: 'Spacing' },
  'image-compress': { Tool: ImageCompress, module: 'design-studio', name: 'Image Compress' },
  'image-resize': { Tool: ImageResize, module: 'design-studio', name: 'Image Resize' },
  'image-convert': { Tool: ImageConvert, module: 'design-studio', name: 'Image Convert' },
  'contrast-checker': { Tool: ContrastChecker, module: 'design-studio', name: 'Contrast Checker' },
  'favicon-generator': { Tool: FaviconGenerator, module: 'design-studio', name: 'Favicon Gen' },
  'utm-builder': { Tool: UtmBuilder, module: 'marketing-lab', name: 'UTM Builder' },
  'seo-meta': { Tool: SeoMeta, module: 'marketing-lab', name: 'SEO Meta' },
  'social-counter': { Tool: SocialCounter, module: 'marketing-lab', name: 'Social Counter' },
  'color-palette': { Tool: ColorPalette, module: 'marketing-lab', name: 'Color Palette' },
  'og-preview': { Tool: OgPreview, module: 'marketing-lab', name: 'OG Preview' },
  'social-resizer': { Tool: SocialResizer, module: 'marketing-lab', name: 'Social Resizer' },
  'invoice-generator': { Tool: InvoiceGenerator, module: 'freelance-core', name: 'Invoice' },
  'rate-calculator': { Tool: RateCalculator, module: 'freelance-core', name: 'Rate Calc' },
  'time-tracker': { Tool: TimeTracker, module: 'freelance-core', name: 'Time Tracker' },
  'expense-tracker': { Tool: ExpenseTracker, module: 'freelance-core', name: 'Expenses' },
  'contract-templates': { Tool: ContractTemplates, module: 'freelance-core', name: 'Contracts' },
  'client-manager': { Tool: ClientManager, module: 'freelance-core', name: 'Clients' },
  'tax-estimator': { Tool: TaxEstimator, module: 'freelance-core', name: 'Tax Estimator' },
  'timezone-converter': { Tool: TimezoneConverter, module: 'freelance-core', name: 'Timezone' },
};

const MODULE_NAMES: Record<string, string> = {
  'workers-suite': "Worker's Suite",
  'playground': 'Playground',
  'design-studio': 'Design Studio',
  'marketing-lab': 'Marketing Lab',
  'freelance-core': 'Freelance Core',
};

interface HomeTab {
  id: string;
  label: string;
  icon: string;
}

const HOME_TABS: HomeTab[] = [
  { id: 'home', label: 'Home', icon: ICONS.home },
  { id: 'workers-suite', label: 'Workers', icon: ICONS.workers },
  { id: 'playground', label: 'Play', icon: ICONS.play },
  { id: 'design-studio', label: 'Design', icon: ICONS.design },
  { id: 'marketing-lab', label: 'Marketing', icon: ICONS.marketing },
  { id: 'freelance-core', label: 'Freelance', icon: ICONS.freelance },
];

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class Home {
  private workspace: HTMLElement;
  private moduleId = 'home';
  private toolInstances = new Map<string, ToolInstance>();
  private activeToolId: string | null = null;
  private gridView: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private navTabsEl: HTMLDivElement | null = null;
  private navQuickEl: HTMLDivElement | null = null;
  private _routeHandler: ((data: any) => void) | null = null;

  constructor(workspace: HTMLElement) {
    this.workspace = workspace;
  }

  async render(): Promise<void> {
    this.workspace.className = 'workspace';
    this.addModuleStyles();

    this.container = document.createElement('div');
    this.container.className = 'module-container';
    this.container.style.gridColumn = '1 / -1';
    this.workspace.appendChild(this.container);

    this.renderGrid();

    this._routeHandler = ({ current }: { current: { module: string | null; tool: string | null } }) => {
      this.setActiveTab(current.module || 'home');
      if (current.module !== this.moduleId) return;
      if (current.tool) this.showTool(current.tool);
      else this.hideTool();
    };
    events.on(ROUTES.CHANGE, this._routeHandler);

    const route = router.getRoute();
    this.setActiveTab(route.module || 'home');
    if (route.module === this.moduleId && route.tool) this.showTool(route.tool);
  }

  private async renderGrid(): Promise<void> {
    this.gridView = document.createElement('div');
    this.gridView.className = 'module-grid';

    const header = document.createElement('div');
    header.className = 'module-header fade-in';
    header.innerHTML = `
      <div class="module-banner">
        <img src="/banners/workers-suite.svg" alt="inztun — The Artisan's Operating System" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Welcome to inztun</h1>
        <p class="module-header__desc">Your personalized workspace. Star tools to see them here.</p>
      </div>
    `;
    this.gridView.appendChild(header);

    const nav = this.renderNav();
    this.gridView.appendChild(nav);

    const wsFavorites = await db.getPreference('favorites', []) as string[];
    const fcFavorites = await db.getPreference('fc-favorites', []) as string[];
    const allFavorites = [...new Set([...wsFavorites, ...fcFavorites])];

    const grid = document.createElement('div');
    grid.className = 'bento-grid';

    if (allFavorites.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'home-empty fade-in';
      empty.style.gridColumn = '1 / -1';
      empty.innerHTML = `
        <div class="home-empty__content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3>No favorites yet</h3>
          <p>Star any tool to see it here for quick access.</p>
          <button class="btn btn--primary" id="home-explore">Explore Tools</button>
        </div>
      `;
      grid.appendChild(empty);

      setTimeout(() => {
        document.getElementById('home-explore')?.addEventListener('click', () => {
          router.navigate('workers-suite');
        });
      }, 0);
    } else {
      allFavorites.forEach((toolId, index) => {
        const toolData = ALL_TOOLS[toolId];
        if (!toolData) return;

        const tool = new toolData.Tool();
        const card = this.createToolCard(toolId, tool, toolData.module, index);
        grid.appendChild(card);
      });
    }

    this.gridView.appendChild(grid);
    this.container!.appendChild(this.gridView);
  }

  private renderNav(): HTMLDivElement {
    const nav = document.createElement('div');
    nav.className = 'home-nav fade-in';

    this.navTabsEl = document.createElement('div');
    this.navTabsEl.className = 'home-nav__tabs';
    this.navTabsEl.innerHTML = HOME_TABS.map(tab => `
      <button class="home-nav__tab ${tab.id === this.moduleId ? 'home-nav__tab--active' : ''}" data-module="${tab.id}">
        <span class="home-nav__tab-icon">${tab.icon}</span>
        <span class="home-nav__tab-label">${tab.label}</span>
      </button>
    `).join('');
    nav.appendChild(this.navTabsEl);

    this.navTabsEl.querySelectorAll('.home-nav__tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleId = (btn as HTMLElement).dataset.module!;
        router.navigate(moduleId);
      });
    });

    this.navQuickEl = document.createElement('div');
    this.navQuickEl.className = 'home-nav__quick';
    nav.appendChild(this.navQuickEl);

    this.loadNavQuickAccess();

    return nav;
  }

  private setActiveTab(moduleId: string): void {
    if (!this.navTabsEl) return;
    this.navTabsEl.querySelectorAll('.home-nav__tab').forEach(tab => {
      const isActive = (tab as HTMLElement).dataset.module === moduleId;
      tab.classList.toggle('home-nav__tab--active', isActive);
    });
  }

  private async loadNavQuickAccess(): Promise<void> {
    if (!this.navQuickEl) return;

    const favorites = await db.getPreference('favorites', []) as string[];
    const fcFavorites = await db.getPreference('fc-favorites', []) as string[];
    const allFavs = [...new Set([...favorites, ...fcFavorites])];

    if (allFavs.length === 0) {
      this.navQuickEl.style.display = 'none';
      return;
    }

    const TOOL_NAMES: Record<string, string> = {
      'json-formatter': 'JSON', 'base64': 'Base64',
      'hash-generator': 'Hash', 'uuid-generator': 'UUID',
      'lorem-ipsum': 'Lorem',
      'char-counter': 'Counter', 'url-encoder': 'URL',
      'markdown-preview': 'MD Preview', 'markdown-html': 'MD→HTML',
      'password-gen': 'Password', 'css-unit': 'CSS Unit',
      'typing-test': 'Typing', 'ascii-art': 'ASCII', 'morse-code': 'Morse', 'pixel-art': 'Pixel',
      'css-gradient': 'Gradient', 'border-radius': 'Radius',
      'typography-scale': 'Type Scale', 'spacing-system': 'Spacing',
      'image-compress': 'Compress', 'image-resize': 'Resize', 'image-convert': 'Convert',
      'contrast-checker': 'Contrast', 'favicon-generator': 'Favicon',
      'utm-builder': 'UTM', 'seo-meta': 'SEO', 'social-counter': 'Social',
      'color-palette': 'Palette',
      'og-preview': 'OG Preview', 'social-resizer': 'Social Resize',
      'invoice-generator': 'Invoice', 'rate-calculator': 'Rate', 'time-tracker': 'Timer',
      'expense-tracker': 'Expenses', 'contract-templates': 'Contracts', 'client-manager': 'Clients',
      'tax-estimator': 'Tax', 'timezone-converter': 'Timezone',
    };

    const TOOL_MODULES: Record<string, string> = {};
    Object.entries({
      'workers-suite': ['json-formatter', 'base64', 'hash-generator', 'uuid-generator', 'lorem-ipsum', 'char-counter', 'url-encoder', 'markdown-preview', 'markdown-html', 'password-gen', 'css-unit'],
      'playground': ['typing-test', 'ascii-art', 'morse-code', 'pixel-art'],
      'design-studio': ['css-gradient', 'border-radius', 'typography-scale', 'spacing-system', 'image-compress', 'image-resize', 'image-convert', 'contrast-checker', 'favicon-generator'],
      'marketing-lab': ['utm-builder', 'seo-meta', 'social-counter', 'color-palette', 'og-preview', 'social-resizer'],
      'freelance-core': ['invoice-generator', 'rate-calculator', 'time-tracker', 'expense-tracker', 'contract-templates', 'client-manager', 'tax-estimator', 'timezone-converter'],
    }).forEach(([mod, tools]) => {
      tools.forEach(t => { TOOL_MODULES[t] = mod; });
    });

    const items = allFavs.slice(0, 8).map(id => {
      const name = TOOL_NAMES[id] || id;
      const mod = TOOL_MODULES[id] || 'workers-suite';
      return `<button class="home-nav__quick-btn" data-module="${mod}" data-tool="${id}" title="${name}">${name}</button>`;
    }).join('');

    this.navQuickEl.innerHTML = `<span class="home-nav__quick-label">Quick</span>${items}`;
    this.navQuickEl.style.display = '';

    this.navQuickEl.querySelectorAll('.home-nav__quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mod = (btn as HTMLElement).dataset.module!;
        const tool = (btn as HTMLElement).dataset.tool!;
        router.navigate(mod, tool);
      });
    });
  }

  private createToolCard(toolId: string, tool: Tool, moduleId: string, index: number): HTMLElement {
    const moduleName = MODULE_NAMES[moduleId] || moduleId;

    const card = new Tile({
      title: tool.name,
      icon: tool.icon,
      badge: moduleName,
      content: `
        <div class="tile__spacer"></div>
        <span class="tile__open-label">Open →</span>
      `,
      span: { col: 4, row: 1 },
    });

    const element = card.render();
    element.classList.add('tile--clickable');
    element.style.animationDelay = `${index * 60}ms`;
    element.addEventListener('click', () => router.navigate(moduleId, toolId));
    return element;
  }

  private showTool(toolId: string): void {
    const toolData = ALL_TOOLS[toolId];
    if (!toolData) return;

    if (this.gridView) this.gridView.style.display = 'none';

    if (!this.toolInstances.has(toolId)) {
      const tool = new toolData.Tool();
      const currentIndex = Object.keys(ALL_TOOLS).indexOf(toolId);
      const toolsList = Object.entries(ALL_TOOLS).map(([id, data]) => ({ id, name: data.name }));

      const viewOptions: ToolViewOptions = {
        toolId,
        toolName: tool.name,
        toolIcon: tool.icon,
        moduleId: toolData.module,
        tools: toolsList,
        currentIndex,
      };

      const view = new ToolView(this.container!, viewOptions);
      const contentEl = view.render();
      const toolWorkspace = document.createElement('div');
      toolWorkspace.className = 'tool-workspace';
      toolWorkspace.innerHTML = tool.render();
      contentEl.appendChild(toolWorkspace);

      this.toolInstances.set(toolId, { tool, view, initialized: false });
    }

    this.toolInstances.forEach((instance, id) => {
      id === toolId ? instance.view.show() : instance.view.hide();
    });

    const instance = this.toolInstances.get(toolId)!;
    if (!instance.initialized) {
      requestAnimationFrame(() => {
        instance.tool.init?.(instance.view.contentEl!);
        instance.view.focusFirstInput();
      });
      instance.initialized = true;
    } else {
      instance.view.focusFirstInput();
    }

    this.activeToolId = toolId;
  }

  private hideTool(): void {
    this.toolInstances.forEach(instance => instance.view.hide());
    if (this.gridView) this.gridView.style.display = '';
    this.activeToolId = null;
  }

  private addModuleStyles(): void {
    if (document.getElementById('home-styles')) return;
    const style = document.createElement('style');
    style.id = 'home-styles';
    style.textContent = `
      .home-nav {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4) 0;
        margin-bottom: var(--space-2);
      }
      .home-nav__tabs {
        display: flex;
        gap: var(--space-1);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .home-nav__tabs::-webkit-scrollbar { display: none; }
      .home-nav__tab {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-3);
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        cursor: pointer;
        border-radius: var(--radius-md);
        transition: all 150ms ease;
        white-space: nowrap;
      }
      .home-nav__tab:hover {
        color: var(--text-primary);
        background: var(--bg-glass);
      }
      .home-nav__tab--active {
        color: var(--accent);
        background: var(--accent-dim);
      }
      .home-nav__tab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }
      .home-nav__tab-icon svg {
        width: 16px;
        height: 16px;
      }
      .home-nav__tab-label {
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .home-nav__quick {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .home-nav__quick::-webkit-scrollbar { display: none; }
      .home-nav__quick-label {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        flex-shrink: 0;
      }
      .home-nav__quick-btn {
        padding: var(--space-1) var(--space-2);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-pill);
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        cursor: pointer;
        transition: all 150ms ease;
        white-space: nowrap;
      }
      .home-nav__quick-btn:hover {
        background: var(--accent-dim);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .home-empty {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }
      .home-empty__content {
        text-align: center;
        color: var(--text-muted);
      }
      .home-empty__content svg {
        margin-bottom: var(--space-4);
        opacity: 0.3;
      }
      .home-empty__content h3 {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }
      .home-empty__content p {
        font-size: var(--text-sm);
        margin-bottom: var(--space-4);
      }
      @media (max-width: 768px) {
        .home-nav__tab-label {
          display: none;
        }
        .home-hero {
          padding: var(--space-4) 0 var(--space-2);
        }
        .home-hero__title {
          font-size: var(--text-2xl);
        }
        .home-hero__desc {
          font-size: var(--text-xs);
        }
        .home-section__title {
          font-size: var(--text-xs);
        }
        .home-nav__quick-btn {
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    if (this._routeHandler) events.off(ROUTES.CHANGE, this._routeHandler);
    this.toolInstances.forEach(({ view, tool }) => { tool.destroy?.(); view.destroy(); });
    this.toolInstances.clear();
    this.navTabsEl = null;
    this.navQuickEl = null;
    this.workspace.innerHTML = '';
  }
}
