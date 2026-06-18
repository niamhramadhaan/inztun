import { ToolView } from '../../components/ToolView';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { createToolCard, createTipsPanel, createCategorySection } from '../../components/ModuleHelpers';
import type { Category } from '../../components/ModuleHelpers';
import { router } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { Toast } from '../../components/Toast';
import { getMarketingLabToolInfo } from './tool-data';
import type { Tool, ToolClass, ToolRegistryEntry, SortMode, ToolViewOptions, ToolInfo } from '../../types/index';

import { UtmBuilder } from './tools/utm-builder';
import { SeoMeta } from './tools/seo-meta';
import { SocialCounter } from './tools/social-counter';
import { ColorPalette } from './tools/color-palette';
import { OgPreview } from './tools/og-preview';
import { SocialResizer } from './tools/social-resizer';
import { BrandExtractor } from './tools/brand-extractor';

const CATEGORIES: Category[] = [
  {
    id: 'campaigns',
    name: 'Campaign Tracking',
    tooltip: 'Build and analyze marketing campaign URLs',
    tools: [
      { id: 'utm-builder', Tool: UtmBuilder, span: { col: 6, row: 1 }, featured: true },
    ],
  },
  {
    id: 'seo-social',
    name: 'SEO & Social',
    tooltip: 'Meta tags, previews, and social media tools',
    tools: [
      { id: 'seo-meta', Tool: SeoMeta, span: { col: 6, row: 1 } },
      { id: 'og-preview', Tool: OgPreview, span: { col: 6, row: 1 } },
      { id: 'social-counter', Tool: SocialCounter, span: { col: 4, row: 1 } },
      { id: 'social-resizer', Tool: SocialResizer, span: { col: 6, row: 1 } },
      { id: 'brand-extractor', Tool: BrandExtractor, span: { col: 6, row: 1 }, featured: true },
    ],
  },
  {
    id: 'color',
    name: 'Color',
    tooltip: 'Color palette generation and extraction',
    tools: [
      { id: 'color-palette', Tool: ColorPalette, span: { col: 4, row: 1 } },
    ],
  },
];

const ALL_TOOLS: ToolRegistryEntry[] = CATEGORIES.flatMap(cat =>
  cat.tools.map(t => ({ ...t, category: cat.id, categoryName: cat.name }))
);

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'utm-builder': 'Build campaign tracking URLs with UTM parameters.',
  'seo-meta': 'Generate meta tags and preview search result snippets.',
  'social-counter': 'Check character counts across social platforms.',
  'color-palette': 'Generate harmonious color palettes from any base color.',
  'og-preview': 'Preview how your page looks on Twitter, Facebook, and LinkedIn.',
  'social-resizer': 'Crop and resize images to exact social media platform dimensions.',
  'brand-extractor': 'Extract brand colors, fonts, logo, and meta from any website URL.',
};

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class MarketingLab {
  private workspace: HTMLElement;
  private moduleId = 'marketing-lab';
  private toolInstances = new Map<string, ToolInstance>();
  private activeToolId: string | null = null;
  private gridView: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private searchQuery = '';
  private sortMode: SortMode = 'alpha';
  private favorites = new Set<string>();
  private collapsedCategories = new Set<string>();
  private categoriesContainer: HTMLDivElement | null = null;
  private _routeHandler: ((data: any) => void) | null = null;
  private toolbar: ModuleToolbar | null = null;

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

    const saved = await db.getPreference('ml-favorites', []) as string[];
    this.favorites = new Set(saved);

    this.renderGrid();

    this._routeHandler = ({ current }: { current: { module: string; tool: string | null } }) => {
      if (current.module !== this.moduleId) return;
      if (current.tool) this.showTool(current.tool);
      else this.hideTool();
    };
    events.on('route:change', this._routeHandler);

    const route = router.getRoute();
    if (route.module === this.moduleId && route.tool) this.showTool(route.tool);
  }

  private renderGrid(): void {
    this.gridView = document.createElement('div');
    this.gridView.className = 'module-grid';

    const header = document.createElement('div');
    header.className = 'module-header fade-in';
    header.innerHTML = `
      <div class="module-banner">
        <img src="/banners/marketing-lab.svg" alt="Marketing Lab — SEO & Campaign Tools" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Marketing Lab</h1>
        <p class="module-header__desc">SEO, campaign tracking, and marketing analytics tools.</p>
      </div>
    `;
    this.gridView.appendChild(header);

    this.toolbar = new ModuleToolbar({
      moduleId: this.moduleId,
      showHome: true,
      initialSort: this.sortMode,
      onHome: () => router.navigate('home'),
      onSearch: (query) => {
        this.searchQuery = query;
        this.renderCategories();
      },
      onSortChange: (mode) => {
        this.sortMode = mode;
        this.renderCategories();
      },
    });
    this.gridView.appendChild(this.toolbar.render());

    this.categoriesContainer = document.createElement('div');
    this.categoriesContainer.className = 'categories-container';
    this.gridView.appendChild(this.categoriesContainer);

    this.container!.appendChild(this.gridView);
    this.renderCategories();
  }

  private renderCategories(): void {
    this.categoriesContainer!.innerHTML = '';
    const isSearching = this.searchQuery.length > 0;

    if (this.sortMode === 'favorites' && !isSearching) {
      const favTools = ALL_TOOLS.filter(t => this.favorites.has(t.id));
      if (favTools.length === 0) {
        this.categoriesContainer!.innerHTML = `
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p>No favorites yet. Click the star on any tool card to add it.</p>
          </div>
        `;
        return;
      }

      const section = createCategorySection({
        category: { id: 'favorites', name: '★ Favorites', tooltip: 'Your pinned tools', tools: favTools },
        collapsed: false,
        onToggleCollapse: () => {},
        createCard: (entry, index) => this.makeToolCard(entry, index),
      });
      this.categoriesContainer!.appendChild(section);
      return;
    }

    CATEGORIES.forEach(cat => {
      let tools = [...cat.tools];

      if (isSearching) {
        tools = tools.filter(t => {
          const name = new t.Tool().name.toLowerCase();
          const desc = (TOOL_DESCRIPTIONS[t.id] || '').toLowerCase();
          return name.includes(this.searchQuery) || desc.includes(this.searchQuery) || t.id.includes(this.searchQuery);
        });
        if (tools.length === 0) return;
      }

      const section = createCategorySection({
        category: { ...cat, tools },
        collapsed: this.collapsedCategories.has(cat.id),
        onToggleCollapse: (catId, expanded) => {
          if (expanded) this.collapsedCategories.delete(catId);
          else this.collapsedCategories.add(catId);
        },
        createCard: (entry, index) => this.makeToolCard(entry, index),
      });
      this.categoriesContainer!.appendChild(section);
    });
  }

  private makeToolCard(entry: ToolRegistryEntry, index: number): HTMLElement {
    const tool = new entry.Tool();
    return createToolCard({
      toolId: entry.id,
      tool,
      span: entry.span,
      featured: entry.featured,
      index,
      moduleId: this.moduleId,
      isFavorite: this.favorites.has(entry.id),
      description: TOOL_DESCRIPTIONS[entry.id] || '',
      onToggleFavorite: (id) => this.toggleFavorite(id),
      onNavigate: (modId, toolId) => router.navigate(modId, toolId),
    });
  }

  private toggleFavorite(toolId: string): void {
    if (this.favorites.has(toolId)) {
      this.favorites.delete(toolId);
      db.setPreference('ml-favorites', Array.from(this.favorites));
      Toast.info('Removed from favorites');
    } else {
      this.favorites.add(toolId);
      db.setPreference('ml-favorites', Array.from(this.favorites));
      Toast.info('Added to favorites');
    }
  }

  private showTool(toolId: string): void {
    const registry = ALL_TOOLS.find(t => t.id === toolId);
    if (!registry) return;

    if (this.gridView) this.gridView.style.display = 'none';

    if (!this.toolInstances.has(toolId)) this.createToolInstance(toolId, registry);

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

  private createToolInstance(toolId: string, registry: ToolRegistryEntry): void {
    const tool = new registry.Tool();
    const currentIndex = ALL_TOOLS.findIndex(t => t.id === toolId);
    const toolsList = ALL_TOOLS.map(t => ({ id: t.id, name: new t.Tool().name }));

    const viewOptions: ToolViewOptions = {
      toolId,
      toolName: tool.name,
      toolIcon: tool.icon,
      toolDescription: TOOL_DESCRIPTIONS[toolId] || '',
      moduleId: this.moduleId,
      tools: toolsList,
      currentIndex,
    };

    const view = new ToolView(this.container!, viewOptions);

    const contentEl = view.render();
    const toolWorkspace = document.createElement('div');
    toolWorkspace.className = 'tool-workspace';
    toolWorkspace.innerHTML = tool.render();
    contentEl.appendChild(toolWorkspace);

    const tipsData = getMarketingLabToolInfo(toolId);
    if (tipsData.useCases.length || tipsData.tips.length) {
      contentEl.appendChild(createTipsPanel({
        toolId,
        data: tipsData,
        moduleId: this.moduleId,
        allTools: ALL_TOOLS,
        onNavigate: (modId, tId) => router.navigate(modId, tId),
      }));
    }

    this.toolInstances.set(toolId, { tool, view, initialized: false });
  }

  private hideTool(): void {
    this.toolInstances.forEach(instance => instance.view.hide());
    if (this.gridView) this.gridView.style.display = '';
    this.activeToolId = null;
  }

  private addModuleStyles(): void {
    if (document.getElementById('marketing-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'marketing-lab-styles';
    style.textContent = `
      .mlu-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .mlo-google-preview {
        padding: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
      }
      .mlo-google-title {
        font-size: var(--text-lg);
        color: #8ab4f8;
        margin-bottom: var(--space-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mlo-google-url {
        font-size: var(--text-xs);
        color: var(--color-success);
        margin-bottom: var(--space-1);
      }
      .mlo-google-desc {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .mls-bars {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .mls-bar {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .mls-bar__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .mls-bar__name {
        font-size: var(--text-sm);
        color: var(--text-primary);
      }
      .mls-bar__count {
        font-size: var(--text-xs);
        font-family: var(--font-mono);
      }
      .mls-bar__track {
        height: 6px;
        background: var(--bg-deep);
        border-radius: 3px;
        overflow: hidden;
      }
      .mls-bar__fill {
        height: 100%;
        border-radius: 3px;
        transition: width 200ms ease;
      }
      .mls-bar__limit {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }
      .mlc-input-row {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }
      .mlc-palettes {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }
      .mlc-palette__name {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: var(--space-1);
      }
      .mlc-swatches {
        display: flex;
        gap: var(--space-2);
      }
      .mlc-swatch {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        cursor: pointer;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 2px;
        transition: transform 150ms ease;
        position: relative;
      }
      .mlc-swatch:hover {
        transform: scale(1.1);
      }
      .mlc-swatch__label {
        font-size: 7px;
        color: #fff;
        font-family: var(--font-mono);
        opacity: 0;
        transition: opacity 150ms ease;
        background: rgba(0,0,0,0.5);
        padding: 1px 3px;
        border-radius: 2px;
      }
      .mlc-swatch:hover .mlc-swatch__label {
        opacity: 1;
      }
      .mla-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }
      .mla-group__title {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }
      .mla-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .mla-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
      }
      .mla-stat__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
      }
      .mla-stat__value {
        font-size: var(--text-lg);
        font-family: var(--font-mono);
        color: var(--accent);
      }
      .mla-verdict {
        text-align: center;
        padding: var(--space-3);
        border-radius: var(--radius-md);
        font-weight: 500;
      }
      .mla-verdict--yes {
        background: rgba(74, 222, 128, 0.1);
        color: var(--color-success);
        border: 1px solid rgba(74, 222, 128, 0.2);
      }
      .mla-verdict--no {
        background: rgba(248, 113, 113, 0.1);
        color: var(--color-error);
        border: 1px solid rgba(248, 113, 113, 0.2);
      }
      .ogp-fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
      .ogp-previews { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-4); }
      .ogp-card { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-hairline); background: var(--bg-deep); }
      .ogp-card__image { height: 150px; background: var(--bg-surface); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: var(--text-ghost); font-size: var(--text-xs); }
      .ogp-card__body { padding: var(--space-3); }
      .ogp-card__site { font-size: 10px; color: var(--text-ghost); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
      .ogp-card__title { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ogp-card__desc { font-size: var(--text-xs); color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .ogp-card--twitter .ogp-card__title { color: #1d9bf0; }
      .ogp-card--facebook .ogp-card__site { color: #8a8d91; }
      .ogp-card--linkedin .ogp-card__title { color: #0a66c2; }

      /* Brand Extractor */
      .mlbe-url-row { display: flex; gap: var(--space-3); align-items: flex-end; margin-bottom: var(--space-4); }
      .mlbe-loading {
        display: flex; align-items: center; gap: var(--space-3);
        padding: var(--space-4); color: var(--text-muted);
        font-size: var(--text-sm); justify-content: center;
      }
      .mlbe-spinner {
        width: 18px; height: 18px; border: 2px solid var(--border-hairline);
        border-top-color: var(--accent); border-radius: 50%;
        animation: mlbe-spin 0.8s linear infinite;
      }
      @keyframes mlbe-spin { to { transform: rotate(360deg); } }
      .mlbe-card {
        background: var(--bg-deep); border: 1px solid var(--border-hairline);
        border-radius: var(--radius-lg); padding: var(--space-5);
      }
      .mlbe-card__header {
        display: flex; align-items: center; gap: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .mlbe-card__title {
        font-family: var(--font-display); font-size: var(--text-xl);
        color: var(--text-primary); font-weight: 600;
      }
      .mlbe-card__desc {
        font-size: var(--text-sm); color: var(--text-muted);
        margin-bottom: var(--space-4); line-height: 1.5;
      }
      .mlbe-section {
        margin-bottom: var(--space-4);
      }
      .mlbe-section__title {
        font-size: var(--text-sm); color: var(--text-secondary);
        font-weight: 500; margin-bottom: var(--space-2);
        display: flex; align-items: center; gap: var(--space-2);
      }
      .mlbe-count {
        font-size: var(--text-xs); color: var(--accent);
        font-family: var(--font-mono);
      }
      .mlbe-colors {
        display: flex; flex-wrap: wrap; gap: var(--space-2);
      }
      .mlbe-fonts {
        display: flex; flex-wrap: wrap; gap: var(--space-2);
      }
      .mlbe-font {
        padding: var(--space-1) var(--space-3); background: var(--bg-surface);
        border: 1px solid var(--border-hairline); border-radius: var(--radius-pill);
        font-size: var(--text-sm); color: var(--text-primary);
        cursor: pointer; transition: all 150ms ease;
      }
      .mlbe-font:hover {
        border-color: var(--accent); color: var(--accent);
      }
      .mlbe-logo {
        display: flex; align-items: center;
      }
      .mlbe-logo-img {
        max-width: 200px; max-height: 80px; object-fit: contain;
        border-radius: var(--radius-md); background: white;
        padding: var(--space-2);
      }
      .mlbe-favicon-img {
        width: 24px; height: 24px; border-radius: 4px;
      }
      .mlbe-og-img {
        max-width: 100%; max-height: 200px; object-fit: cover;
        border-radius: var(--radius-md); border: 1px solid var(--border-hairline);
      }
      .mlbe-empty {
        font-size: var(--text-xs); color: var(--text-ghost); font-style: italic;
      }

      @media (max-width: 768px) {
        .mlu-fields, .mla-grid, .mla-stats, .ogp-fields {
          grid-template-columns: 1fr;
        }
        .mlbe-url-row {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    if (this._routeHandler) {
      events.off('route:change', this._routeHandler);
    }
    this.toolbar?.destroy();
    this.toolInstances.forEach(({ view, tool }) => { tool.destroy?.(); view.destroy(); });
    this.toolInstances.clear();
    this.workspace.innerHTML = '';
  }
}
