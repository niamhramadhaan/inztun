import { ToolView } from '../../components/ToolView';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { createToolCard, createTipsPanel } from '../../components/ModuleHelpers';
import { router } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { getDesignStudioToolInfo } from './tool-data';
import type { Tool, ToolClass, ToolRegistryEntry, SortMode, ToolViewOptions, ToolInfo } from '../../types/index';

import { CssGradient } from './tools/css-gradient';
import { BorderRadius } from './tools/border-radius';
import { TypographyScale } from './tools/typography-scale';
import { SpacingSystem } from './tools/spacing-system';
import { ImageCompress } from './tools/image-compress';
import { ImageResize } from './tools/image-resize';
import { ImageConvert } from './tools/image-convert';
import { ContrastChecker } from './tools/contrast-checker';
import { FaviconGenerator } from './tools/favicon-generator';

const TOOL_REGISTRY: ToolRegistryEntry[] = [
  { id: 'css-gradient', Tool: CssGradient, span: { col: 6, row: 1 } },
  { id: 'border-radius', Tool: BorderRadius, span: { col: 4, row: 1 } },
  { id: 'typography-scale', Tool: TypographyScale, span: { col: 4, row: 1 } },
  { id: 'spacing-system', Tool: SpacingSystem, span: { col: 4, row: 1 } },
  { id: 'image-compress', Tool: ImageCompress, span: { col: 6, row: 1 }, featured: true },
  { id: 'image-resize', Tool: ImageResize, span: { col: 6, row: 1 } },
  { id: 'image-convert', Tool: ImageConvert, span: { col: 6, row: 1 } },
  { id: 'contrast-checker', Tool: ContrastChecker, span: { col: 6, row: 1 } },
  { id: 'favicon-generator', Tool: FaviconGenerator, span: { col: 6, row: 1 } },
];

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
  private toolsGrid: HTMLDivElement | null = null;
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

    const saved = await db.getPreference('ds-favorites', []) as string[];
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
        this.renderTools();
      },
      onSortChange: (mode) => {
        this.sortMode = mode;
        this.renderTools();
      },
    });
    this.gridView.appendChild(this.toolbar.render());

    this.toolsGrid = document.createElement('div');
    this.toolsGrid.className = 'bento-grid';
    this.gridView.appendChild(this.toolsGrid);

    this.container!.appendChild(this.gridView);
    this.renderTools();
  }

  private renderTools(): void {
    if (!this.toolsGrid) return;
    this.toolsGrid.innerHTML = '';

    let tools = [...TOOL_REGISTRY];

    if (this.sortMode === 'favorites' && !this.searchQuery) {
      tools = tools.filter(t => this.favorites.has(t.id));
      if (tools.length === 0) {
        this.toolsGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p>No favorites yet. Click the star on any tool card to add it.</p>
          </div>
        `;
        return;
      }
    }

    if (this.searchQuery) {
      tools = tools.filter(t => {
        const tool = new t.Tool();
        const name = tool.name.toLowerCase();
        const desc = (TOOL_DESCRIPTIONS[t.id] || '').toLowerCase();
        return name.includes(this.searchQuery) || desc.includes(this.searchQuery) || t.id.includes(this.searchQuery);
      });
    }

    if (this.sortMode === 'alpha') {
      tools.sort((a, b) => new a.Tool().name.localeCompare(new b.Tool().name));
    } else if (this.sortMode === 'favorites') {
      tools.sort((a, b) => {
        const af = this.favorites.has(a.id) ? 0 : 1;
        const bf = this.favorites.has(b.id) ? 0 : 1;
        return af - bf || new a.Tool().name.localeCompare(new b.Tool().name);
      });
    }

    if (tools.length === 0) {
      this.toolsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>No tools match "${this.searchQuery}".</p>
        </div>
      `;
      return;
    }

    tools.forEach((entry, index) => {
      const tool = new entry.Tool();
      this.toolsGrid!.appendChild(createToolCard({
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
      }));
    });
  }

  private toggleFavorite(toolId: string): void {
    if (this.favorites.has(toolId)) {
      this.favorites.delete(toolId);
    } else {
      this.favorites.add(toolId);
    }
    db.setPreference('ds-favorites', Array.from(this.favorites));
  }

  private showTool(toolId: string): void {
    const registry = TOOL_REGISTRY.find(t => t.id === toolId);
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
    const currentIndex = TOOL_REGISTRY.findIndex(t => t.id === toolId);
    const toolsList = TOOL_REGISTRY.map(t => ({ id: t.id, name: new t.Tool().name }));

    const viewOptions: ToolViewOptions = {
      toolId,
      toolName: tool.name,
      toolIcon: tool.icon,
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
      contentEl.appendChild(createTipsPanel({
        toolId,
        data: tipsData,
        moduleId: this.moduleId,
        allTools: TOOL_REGISTRY,
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
