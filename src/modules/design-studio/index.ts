import type { Category } from '../../components/ModuleHelpers';
import {
  createCategorySection,
  createTipsPanel,
  createToolCard,
} from '../../components/ModuleHelpers';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { Toast } from '../../components/Toast';
import { ToolView } from '../../components/ToolView';
import { db } from '../../core/db';
import { events } from '../../core/events';
import { router } from '../../core/router';
import type {
  SortMode,
  Tool,
  ToolClass,
  ToolInfo,
  ToolRegistryEntry,
  ToolViewOptions,
} from '../../types/index';
import { getDesignStudioToolInfo } from './tool-data';
import { BorderRadius } from './tools/border-radius';
import { BrandGuidelines } from './tools/brand-guidelines';
import { ContrastChecker } from './tools/contrast-checker';
import { CssGradient } from './tools/css-gradient';
import { FaviconGenerator } from './tools/favicon-generator';
import { FontPairer } from './tools/font-pairer';
import { ImageCompress } from './tools/image-compress';
import { ImageConvert } from './tools/image-convert';
import { ImageCrop } from './tools/image-crop';
import { ImageFilters } from './tools/image-filters';
import { ImageMetadata } from './tools/image-metadata';
import { ImageResize } from './tools/image-resize';
import { LogoBuilder } from './tools/logo-builder';
import { SpacingSystem } from './tools/spacing-system';
import { TypographyScale } from './tools/typography-scale';

const CATEGORIES: Category[] = [
  {
    id: 'layout',
    name: 'Layout & Shape',
    tooltip: 'Gradients, borders, and spacing tools',
    tools: [
      { id: 'css-gradient', Tool: CssGradient, span: { col: 6, row: 1 } },
      { id: 'border-radius', Tool: BorderRadius, span: { col: 4, row: 1 } },
      { id: 'spacing-system', Tool: SpacingSystem, span: { col: 4, row: 1 } },
    ],
  },
  {
    id: 'typography',
    name: 'Typography & Color',
    tooltip: 'Type scales and contrast checking',
    tools: [
      { id: 'typography-scale', Tool: TypographyScale, span: { col: 4, row: 1 } },
      { id: 'contrast-checker', Tool: ContrastChecker, span: { col: 6, row: 1 } },
    ],
  },
  {
    id: 'image',
    name: 'Image Processing',
    tooltip: 'Compress, resize, convert, crop, filter, and inspect images',
    tools: [
      { id: 'image-compress', Tool: ImageCompress, span: { col: 6, row: 1 }, featured: true },
      { id: 'image-resize', Tool: ImageResize, span: { col: 6, row: 1 } },
      { id: 'image-convert', Tool: ImageConvert, span: { col: 6, row: 1 } },
      { id: 'image-crop', Tool: ImageCrop, span: { col: 6, row: 1 } },
      { id: 'image-filters', Tool: ImageFilters, span: { col: 6, row: 1 } },
      { id: 'image-metadata', Tool: ImageMetadata, span: { col: 6, row: 1 } },
    ],
  },
  {
    id: 'branding',
    name: 'Branding',
    tooltip: 'Favicons, logos, fonts, and brand guidelines',
    tools: [
      { id: 'favicon-generator', Tool: FaviconGenerator, span: { col: 6, row: 1 } },
      { id: 'logo-builder', Tool: LogoBuilder, span: { col: 6, row: 1 } },
      { id: 'font-pairer', Tool: FontPairer, span: { col: 6, row: 1 } },
      { id: 'brand-guidelines', Tool: BrandGuidelines, span: { col: 6, row: 1 }, featured: true },
    ],
  },
];

const ALL_TOOLS: ToolRegistryEntry[] = CATEGORIES.flatMap((cat) =>
  cat.tools.map((t) => ({ ...t, category: cat.id, categoryName: cat.name })),
);

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'css-gradient': 'Build and preview CSS gradients with live output.',
  'border-radius': 'Preview and customize border radius for any shape.',
  'typography-scale': 'Generate modular type scales with CSS custom properties.',
  'spacing-system': 'Create consistent spacing tokens for your design system.',
  'image-compress': 'Shrink image file sizes for web without losing visible quality.',
  'image-resize': 'Scale images to exact pixel dimensions with aspect ratio lock.',
  'image-convert': 'Convert between PNG, JPEG, and WebP formats.',
  'contrast-checker': 'Check WCAG contrast ratios for accessible text on any background.',
  'favicon-generator': 'Generate favicons in all standard sizes from any image.',
  'logo-builder': 'Build logos with shapes, icons, and text. Export as PNG.',
  'image-crop': 'Interactive crop with drag handles and preset aspect ratios.',
  'image-filters': 'Apply filters like grayscale, sepia, brightness, contrast, and blur.',
  'image-metadata': 'Read and strip EXIF metadata from images.',
  'font-pairer': 'Browse curated font pairings for headings and body text.',
  'brand-guidelines': 'Generate a premium brand guidelines board as PNG or PDF.',
};

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class DesignStudio {
  private workspace: HTMLElement;
  private moduleId = 'design-studio';
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

    const saved = (await db.getPreference('ds-favorites', [])) as string[];
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
        <img src="/banners/design-studio.svg" alt="Design Studio — Visual Design Tools" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Design Studio</h1>
        <p class="module-header__desc">Visual tools for CSS, typography, spacing, and icon design.</p>
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
      const favTools = ALL_TOOLS.filter((t) => this.favorites.has(t.id));
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
        category: {
          id: 'favorites',
          name: '★ Favorites',
          tooltip: 'Your pinned tools',
          tools: favTools,
        },
        collapsed: false,
        onToggleCollapse: () => {},
        createCard: (entry, index) => this.makeToolCard(entry, index),
      });
      this.categoriesContainer!.appendChild(section);
      return;
    }

    CATEGORIES.forEach((cat) => {
      let tools = [...cat.tools];

      if (isSearching) {
        tools = tools.filter((t) => {
          const name = new t.Tool().name.toLowerCase();
          const desc = (TOOL_DESCRIPTIONS[t.id] || '').toLowerCase();
          return (
            name.includes(this.searchQuery) ||
            desc.includes(this.searchQuery) ||
            t.id.includes(this.searchQuery)
          );
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
      db.setPreference('ds-favorites', Array.from(this.favorites));
      Toast.info('Removed from favorites');
    } else {
      this.favorites.add(toolId);
      db.setPreference('ds-favorites', Array.from(this.favorites));
      Toast.info('Added to favorites');
    }
  }

  private showTool(toolId: string): void {
    const registry = ALL_TOOLS.find((t) => t.id === toolId);
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
    const currentIndex = ALL_TOOLS.findIndex((t) => t.id === toolId);
    const toolsList = ALL_TOOLS.map((t) => ({ id: t.id, name: new t.Tool().name }));

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

    const tipsData = getDesignStudioToolInfo(toolId);
    if (tipsData.useCases.length || tipsData.tips.length) {
      contentEl.appendChild(
        createTipsPanel({
          toolId,
          data: tipsData,
          moduleId: this.moduleId,
          allTools: ALL_TOOLS,
          onNavigate: (modId, tId) => router.navigate(modId, tId),
        }),
      );
    }

    this.toolInstances.set(toolId, { tool, view, initialized: false });
  }

  private hideTool(): void {
    this.toolInstances.forEach((instance) => instance.view.hide());
    if (this.gridView) this.gridView.style.display = '';
    this.activeToolId = null;
  }

  private addModuleStyles(): void {
    if (document.getElementById('design-studio-styles')) return;
    const style = document.createElement('style');
    style.id = 'design-studio-styles';
    style.textContent = `
      .dsg-gradient-controls {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }
      .dsg-gradient-preview {
        width: 100%;
        margin-bottom: var(--space-4);
      }
      .dsg-stops {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }
      .dsg-stop {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .dsg-stop__color {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .dsg-stop__pos {
        flex: 1;
      }
      .dsg-stop__val {
        font-size: var(--text-xs);
        color: var(--text-muted);
        width: 40px;
        text-align: right;
      }
      .dsg-presets { margin-top: var(--space-4); }
      .dsg-presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: var(--space-2);
      }
      .dsg-preset-btn {
        width: 100%; aspect-ratio: 1; border: 2px solid var(--border-hairline);
        border-radius: var(--radius-md); cursor: pointer; transition: transform 150ms, border-color 150ms;
      }
      .dsg-preset-btn:hover { transform: scale(1.08); border-color: var(--accent); }
      .dsb-preview-wrap {
        display: flex;
        justify-content: center;
        padding: var(--space-8);
        margin-bottom: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-lg);
      }
      .dsb-preview {
        width: 120px;
        height: 120px;
        background: var(--bg-surface);
        border-radius: var(--radius-md);
      }
      .dsb-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .dsb-val {
        font-size: var(--text-xs);
        color: var(--text-muted);
        font-family: var(--font-mono);
      }
      .dsb-color-input {
        width: 100%;
        height: 32px;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        background: transparent;
      }
      .dsr-preview-wrap {
        display: flex;
        justify-content: center;
        padding: var(--space-8);
        margin-bottom: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-lg);
      }
      .dsr-preview {
        width: 140px;
        height: 140px;
        background: var(--accent-dim);
        border: 2px solid var(--accent);
        border-radius: 16px;
      }
      .dsr-controls {
        margin-bottom: var(--space-4);
      }
      .dsr-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-3);
      }
      .dsr-val {
        font-size: var(--text-xs);
        color: var(--text-muted);
        font-family: var(--font-mono);
      }
      .dst-controls {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }
      .dst-preview {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
        padding: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-lg);
      }
      .dst-step {
        display: flex;
        align-items: baseline;
        gap: var(--space-3);
      }
      .dst-step__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        width: 40px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .dst-step__size {
        color: var(--text-primary);
        font-family: var(--font-display);
      }
      .dst-step__value {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
        margin-left: auto;
      }
      .dss-controls {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }
      .dss-preview {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
        padding: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-lg);
      }
      .dss-step {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .dss-step__bar {
        height: 12px;
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        border-radius: 2px;
        min-width: 4px;
      }
      .dss-step__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        width: 20px;
        text-align: right;
      }
      .dss-step__value {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }
      .dsi-controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: end;
        margin-bottom: var(--space-4);
      }
      .dsi-canvas-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-4);
      }
      .imgc-drop-zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8);
        border: 2px dashed var(--border-hairline);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 200ms ease;
        text-align: center;
        color: var(--text-muted);
      }
      .imgc-drop-zone:hover { border-color: var(--accent); color: var(--text-secondary); }
      .imgc-drop-zone--active { border-color: var(--accent); background: var(--accent-dim); }
      .imgc-drop-zone__hint { font-size: var(--text-xs); color: var(--text-ghost); }
      .imgc-controls {
        display: flex;
        gap: var(--space-4);
        align-items: flex-end;
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }
      .imgc-preview {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
      }
      .imgc-preview__item {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .imgc-canvas {
        border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline);
        max-width: 100%;
        max-height: 300px;
        object-fit: contain;
      }
      .imgc-size {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-align: center;
      }
      .imgc-savings {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        text-align: center;
        background: var(--bg-deep);
      }
      .imgc-savings--positive { color: var(--color-success); }
      .imgc-savings--negative { color: var(--color-error); }
      .cc-controls { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--space-4); }
      .cc-color-row { display: flex; gap: var(--space-2); align-items: center; }
      .cc-color-picker { width: 40px; height: 36px; border: none; border-radius: var(--radius-sm); cursor: pointer; }
      .cc-swap { align-self: flex-end; }
      .cc-ratio { font-family: var(--font-mono); font-size: var(--text-2xl); text-align: center; padding: var(--space-4); margin-bottom: var(--space-4); border-radius: var(--radius-lg); background: var(--bg-deep); }
      .cc-ratio--good { color: var(--color-success); }
      .cc-ratio--ok { color: #facc15; }
      .cc-ratio--bad { color: var(--color-error); }
      .cc-badges { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4); justify-content: center; }
      .cc-badge { padding: var(--space-1) var(--space-3); border-radius: var(--radius-pill); font-size: var(--text-xs); font-family: var(--font-mono); }
      .cc-badge--pass { background: rgba(74,222,128,0.1); color: var(--color-success); border: 1px solid rgba(74,222,128,0.2); }
      .cc-badge--fail { background: rgba(248,113,113,0.1); color: var(--color-error); border: 1px solid rgba(248,113,113,0.2); }
      .cc-preview { padding: var(--space-6); border-radius: var(--radius-lg); border: 1px solid var(--border-hairline); text-align: center; }
      .cc-preview__large { font-size: var(--text-xl); font-weight: 600; margin-bottom: var(--space-2); }
      .cc-preview__normal { font-size: var(--text-sm); }
      .svg-savings { font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); text-align: center; background: var(--bg-deep); margin-bottom: var(--space-4); }
      .svg-savings--positive { color: var(--color-success); }
      .fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-4); }
      .fav-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-3); background: var(--bg-deep); border-radius: var(--radius-md); border: 1px solid var(--border-hairline); }
      .fav-canvas { border-radius: var(--radius-sm); image-rendering: pixelated; }
      .fav-item__info { text-align: center; }
      .fav-item__label { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-primary); display: block; }
      .fav-item__desc { font-size: var(--text-xs); color: var(--text-ghost); display: block; }
      @media (max-width: 768px) {
        .dsg-gradient-controls, .dsb-controls, .dsr-inputs, .dst-controls, .dss-controls, .dsi-controls, .cc-controls, .imgc-controls {
          grid-template-columns: 1fr;
          flex-direction: column;
        }
        .imgc-preview { flex-direction: column; }
        .fav-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
      }

      /* ── Logo Builder ── */
      .lb-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: var(--space-4);
        align-items: start;
      }
      .lb-controls {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .lb-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .lb-shape-picker {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }
      .lb-shape-btn {
        width: 100%;
        height: 30px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lb-shape-btn--active {
        background: var(--accent-dim);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .lb-fill-toggle {
        display: flex;
        gap: var(--space-1);
      }
      .lb-fill-btn {
        flex: 1;
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
        text-align: center;
      }
      .lb-fill-btn--active {
        background: var(--accent-dim);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .lb-color-row {
        display: flex;
        gap: var(--space-3);
        align-items: center;
      }
      .lb-color-field {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .lb-color-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .lb-color-input {
        width: 36px;
        height: 28px;
        padding: 0;
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        background: transparent;
      }
      .lb-color-hex {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .lb-source-toggle {
        display: flex;
        gap: var(--space-1);
      }
      .lb-source-btn--active {
        background: var(--accent-dim);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .lb-icon-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        max-height: 160px;
        overflow-y: auto;
        padding: var(--space-1);
      }
      .lb-icon-btn {
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lb-icon-btn--active {
        background: var(--accent-dim);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .lb-icon-preview {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lb-icon-preview svg {
        width: 16px;
        height: 16px;
      }
      .lb-text-input {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .lb-upload-input {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .lb-upload-drop {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60px;
        border: 2px dashed var(--border-hairline);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        cursor: pointer;
        font-size: var(--text-sm);
        color: var(--text-muted);
        transition: border-color 150ms;
      }
      .lb-upload-drop:hover {
        border-color: var(--accent);
        color: var(--text-secondary);
      }
      .lb-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--bg-deep);
        border-radius: 3px;
        outline: none;
      }
      .lb-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: var(--accent);
        border-radius: 50%;
        cursor: pointer;
      }
      .lb-size-val {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .lb-saved-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .lb-saved-swatch {
        width: 24px;
        height: 24px;
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: transform 150ms ease;
        padding: 0;
      }
      .lb-saved-swatch:hover {
        transform: scale(1.2);
      }
      .lb-export-sizes { display: flex; gap: var(--space-1); }
      .lb-size-btn--active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
      .lb-preview-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        align-items: center;
      }
      .lb-canvas-stack {
        position: relative;
        width: 100%;
        max-width: 400px;
        aspect-ratio: 1;
      }
      .lb-canvas {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        background: #1a1a1a;
      }
      .lb-canvas--overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      @media (max-width: 768px) {
        .lb-layout {
          grid-template-columns: 1fr;
        }
      }

      /* ── Image Crop ── */
      .imcr-controls { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--space-4); }
      .imcr-ratio-btns { display: flex; gap: var(--space-1); flex-wrap: wrap; }
      .imcr-ratio-btn--active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
      .imcr-canvas-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
      .imcr-canvas { border: 1px solid var(--border-hairline); border-radius: var(--radius-md); cursor: crosshair; max-width: 100%; touch-action: none; }
      .imcr-dims { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--accent); text-align: center; }

      /* ── Image Filters ── */
      .imgf-controls { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
      .imgf-toggles { display: flex; gap: var(--space-2); flex-wrap: wrap; }
      .imgf-toggle--active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
      .imgf-sliders { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); }
      .imgf-canvas-wrap { margin-bottom: var(--space-4); }
      .imgf-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
      .imgf-split__item { display: flex; flex-direction: column; gap: var(--space-2); }
      .imgf-canvas { border: 1px solid var(--border-hairline); border-radius: var(--radius-md); max-width: 100%; max-height: 400px; object-fit: contain; }
      @media (max-width: 768px) { .imgf-split { grid-template-columns: 1fr; } }

      /* ── Image Metadata ── */
      .imgm-meta { margin-bottom: var(--space-4); max-height: 400px; overflow-y: auto; }
      .imgm-table { display: flex; flex-direction: column; }
      .imgm-row { display: flex; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-hairline); }
      .imgm-row__key { font-size: var(--text-xs); color: var(--text-muted); min-width: 120px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.05em; }
      .imgm-row__val { font-size: var(--text-sm); color: var(--text-primary); font-family: var(--font-mono); word-break: break-all; }
      .imgm-link { color: var(--accent); text-decoration: none; }
      .imgm-link:hover { text-decoration: underline; }
      .imgm-empty { color: var(--text-muted); font-size: var(--text-sm); padding: var(--space-4); text-align: center; }
      .imgm-actions { display: flex; flex-direction: column; gap: var(--space-3); }

      /* ── Batch shared ── */
      .imgc-batch-list { margin-bottom: var(--space-4); max-height: 200px; overflow-y: auto; border: 1px solid var(--border-hairline); border-radius: var(--radius-md); }
      .imgc-batch-header { padding: var(--space-2) var(--space-3); font-size: var(--text-xs); color: var(--text-muted); border-bottom: 1px solid var(--border-hairline); text-transform: uppercase; letter-spacing: 0.05em; }
      .imgc-batch-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-hairline); font-size: var(--text-xs); }
      .imgc-batch-item:last-child { border-bottom: none; }
      .imgc-batch-item__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .imgc-batch-item__size { color: var(--text-muted); font-family: var(--font-mono); }
      .imgc-batch-item__status { font-family: var(--font-mono); color: var(--text-muted); min-width: 60px; text-align: right; }

      /* ── EXIF strip row ── */
      .imgc-exif-row { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
      .imgc-note { font-size: var(--text-xs); color: var(--text-ghost); }

      /* ── Compress bar ── */
      .imgc-bar-wrap { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
      .imgc-bar { height: 8px; background: var(--bg-deep); border-radius: 4px; overflow: hidden; }
      .imgc-bar__fill { height: 100%; border-radius: 4px; transition: width 200ms ease; }

      /* ── Font Pairer ── */
      .fp-controls { display: grid; grid-template-columns: 1fr 200px; gap: var(--space-4); margin-bottom: var(--space-4); align-items: start; }
      .fp-pair-list { display: flex; flex-wrap: wrap; gap: var(--space-1); max-height: 200px; overflow-y: auto; }
      .fp-pair-btn { display: flex; flex-direction: column; gap: 2px; text-align: left; padding: var(--space-2) var(--space-3); }
      .fp-pair-btn--active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
      .fp-pair-cat { font-size: var(--text-xs); color: var(--text-ghost); text-transform: uppercase; letter-spacing: 0.05em; }
      .fp-pair-name { font-size: var(--text-sm); }
      .fp-settings { display: flex; flex-direction: column; gap: var(--space-3); }
      .fp-preview { padding: var(--space-6); background: var(--bg-deep); border-radius: var(--radius-lg); margin-bottom: var(--space-4); }
      .fp-css-output { margin-bottom: var(--space-4); }
      @media (max-width: 768px) { .fp-controls { grid-template-columns: 1fr; } }

      /* ── Brand Guidelines ── */
      .bgl-layout { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-4); align-items: start; }
      .bgl-controls { display: flex; flex-direction: column; gap: var(--space-3); }
      .bgl-logo-upload { cursor: pointer; }
      .bgl-logo-preview { display: flex; align-items: center; justify-content: center; min-height: 60px; border: 2px dashed var(--border-hairline); border-radius: var(--radius-md); padding: var(--space-3); }
      .bgl-logo-placeholder { font-size: var(--text-sm); color: var(--text-muted); }
      .bgl-colors { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2); }
      .bgl-color-item { display: flex; align-items: center; gap: var(--space-1); }
      .bgl-color-input { width: 32px; height: 28px; border: none; border-radius: var(--radius-sm); cursor: pointer; background: transparent; }
      .bgl-color-hex { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }
      .bgl-color-remove { padding: 0; width: 20px; height: 20px; }
      .bgl-color-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
      .bgl-palette-grid { display: flex; flex-direction: column; gap: var(--space-2); max-height: 300px; overflow-y: auto; }
      .bgl-palette-card { cursor: pointer; padding: var(--space-2); border: 1px solid var(--border-hairline); border-radius: var(--radius-md); transition: border-color 150ms, transform 150ms; }
      .bgl-palette-card:hover { border-color: var(--accent); transform: translateY(-1px); }
      .bgl-palette-strip { display: flex; height: 32px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: var(--space-1); }
      .bgl-palette-cell { flex: 1; }
      .bgl-palette-label { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
      .bgl-preview-area { overflow: auto; max-height: 80vh; }
      .bgl-canvas { width: 100%; height: auto; border-radius: var(--radius-lg); border: 1px solid var(--border-hairline); }
      @media (max-width: 768px) { .bgl-layout { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    if (this._routeHandler) {
      events.off('route:change', this._routeHandler);
    }
    this.toolbar?.destroy();
    this.toolInstances.forEach(({ view, tool }) => {
      tool.destroy?.();
      view.destroy();
    });
    this.toolInstances.clear();
    this.workspace.innerHTML = '';
  }
}
