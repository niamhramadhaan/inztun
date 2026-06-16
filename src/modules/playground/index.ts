import { ToolView } from '../../components/ToolView';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { createToolCard, createTipsPanel } from '../../components/ModuleHelpers';
import { router } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { getPlaygroundToolInfo } from './tool-data';
import type { Tool, ToolClass, ToolRegistryEntry, SortMode, ToolViewOptions, ToolInfo } from '../../types/index';

import { TypingTest } from './tools/typing-test';
import { BannerGenerator } from './tools/ascii-art';
import { PixelArt } from './tools/pixel-art';

const TOOL_REGISTRY: ToolRegistryEntry[] = [
  { id: 'typing-test', Tool: TypingTest, span: { col: 6, row: 1 }, featured: true },
  { id: 'banner-generator', Tool: BannerGenerator, span: { col: 6, row: 1 } },
  { id: 'pixel-art', Tool: PixelArt, span: { col: 8, row: 2 } },
];

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'typing-test': 'Test your typing speed with WPM and accuracy tracking.',
  'banner-generator': 'Generate text banners for terminal, README, and CLI headers.',
  'pixel-art': 'Draw pixel art on a grid and export as PNG.',
};

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class Playground {
  private workspace: HTMLElement;
  private moduleId = 'playground';
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

    const saved = await db.getPreference('pg-favorites', []) as string[];
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
        <img src="/banners/playground.svg" alt="Playground — Fun & Creative Tools" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Playground</h1>
        <p class="module-header__desc">Fun, creative, and playful tools. No practical purpose — just vibes.</p>
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
    db.setPreference('pg-favorites', Array.from(this.favorites));
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

    const tipsData = getPlaygroundToolInfo(toolId);
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
    if (document.getElementById('playground-styles')) return;
    const style = document.createElement('style');
    style.id = 'playground-styles';
    style.textContent = `
      .typing-stats {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        flex-wrap: wrap;
      }

      .typing-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-2) var(--space-4);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
      }

      .typing-stat--main {
        min-width: 100px;
      }

      .typing-stat__value {
        font-family: var(--font-mono);
        font-size: var(--text-xl);
        color: var(--accent);
        font-weight: 500;
      }

      .typing-stat__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .typing-stat__target {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }

      .tt-controls {
        display: flex;
        gap: var(--space-3);
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }

      .tt-segment {
        display: flex;
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .tt-seg-btn {
        padding: var(--space-1) var(--space-3);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .tt-seg-btn:hover {
        color: var(--text-primary);
        background: var(--bg-glass);
      }

      .tt-seg-btn--active {
        color: var(--accent);
        background: var(--accent-dim);
      }

      .tt-timed-select {
        display: flex;
        gap: var(--space-1);
      }

      .tt-time-btn {
        padding: var(--space-1) var(--space-2);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 150ms ease;
      }

      .tt-time-btn:hover {
        color: var(--text-primary);
        border-color: var(--border-subtle);
      }

      .tt-time-btn--active {
        color: var(--accent);
        border-color: var(--accent-border);
        background: var(--accent-dim);
      }

      .tt-progress {
        height: 4px;
        background: var(--bg-deep);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: var(--space-3);
      }

      .tt-progress__bar {
        height: 100%;
        background: var(--accent);
        border-radius: 2px;
        transition: width 100ms linear;
        width: 0%;
      }

      .tt-results {
        margin-top: var(--space-4);
      }

      .tt-results__card {
        padding: var(--space-6);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-lg);
        text-align: center;
      }

      .tt-results__wpm {
        font-family: var(--font-mono);
        font-size: var(--text-4xl);
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1;
      }

      .tt-results__wpm--hit {
        color: var(--color-success);
      }

      .tt-results__label {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin-top: var(--space-2);
      }

      .tt-results__row {
        display: flex;
        justify-content: center;
        gap: var(--space-6);
        margin-top: var(--space-4);
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }

      .tt-results__row strong {
        color: var(--text-primary);
        font-family: var(--font-mono);
      }

      .tt-results__actions {
        display: flex;
        justify-content: center;
        gap: var(--space-2);
        margin-top: var(--space-4);
      }

      .typing-display {
        padding: var(--space-4);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        line-height: 1.8;
        min-height: 80px;
      }

      .typing-char {
        position: relative;
        transition: color 100ms ease;
      }

      .typing-char--correct {
        color: var(--color-success);
      }

      .typing-char--wrong {
        color: var(--color-error);
        background: rgba(248, 113, 113, 0.15);
        border-radius: 2px;
      }

      .typing-char--current {
        color: var(--accent);
        border-bottom: 2px solid var(--accent);
      }

      .typing-input {
        width: 100%;
        min-height: 60px;
        padding: var(--space-3);
        font-family: var(--font-mono);
        font-size: var(--text-base);
        background: var(--bg-surface);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        outline: none;
        resize: none;
      }

      .typing-input:focus {
        border-color: var(--accent);
      }

      .typing-input:disabled {
        opacity: 0.5;
      }

      .ascii-output {
        flex: 1;
        padding: var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.2;
        overflow-x: auto;
        white-space: pre;
        color: var(--accent);
      }

      .password-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--bg-deep);
        border-radius: 3px;
        outline: none;
      }

      .password-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: var(--accent);
        border-radius: 50%;
        cursor: pointer;
      }

      .px-controls { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--space-4); }
      .px-tools { display: flex; gap: var(--space-1); }
      .px-tool { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); cursor: pointer; font-size: 16px; transition: all 150ms ease; }
      .px-tool:hover { border-color: var(--border-subtle); }
      .px-tool--active { border-color: var(--accent); background: var(--accent-dim); }
      .px-palette { display: flex; gap: var(--space-1); flex-wrap: wrap; align-items: center; }
      .px-swatch { width: 24px; height: 24px; border: 2px solid var(--border-hairline); border-radius: var(--radius-sm); cursor: pointer; transition: all 150ms ease; padding: 0; }
      .px-swatch:hover { transform: scale(1.15); }
      .px-swatch--active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }
      .px-custom-color { width: 24px; height: 24px; border: none; border-radius: var(--radius-sm); cursor: pointer; padding: 0; }
      .px-canvas-wrap { display: flex; justify-content: center; margin-bottom: var(--space-4); }
      #px-canvas { border: 1px solid var(--border-hairline); border-radius: var(--radius-md); cursor: crosshair; image-rendering: pixelated; }
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
