import { ToolView } from '../../components/ToolView';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { createToolCard, createTipsPanel, createCategorySection } from '../../components/ModuleHelpers';
import type { Category } from '../../components/ModuleHelpers';
import { router } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { getFreelanceCoreToolInfo } from './tool-data';
import type { Tool, ToolClass, ToolRegistryEntry, SortMode, ToolViewOptions, ToolInfo } from '../../types/index';

import { InvoiceGenerator } from './tools/invoice-generator';
import { RateCalculator } from './tools/rate-calculator';
import { TimeTracker } from './tools/time-tracker';
import { ExpenseTracker } from './tools/expense-tracker';
import { ContractTemplates } from './tools/contract-templates';
import { ClientManager } from './tools/client-manager';
import { TaxEstimator } from './tools/tax-estimator';
import { TimezoneConverter } from './tools/timezone-converter';

const CATEGORIES: Category[] = [
  {
    id: 'invoicing',
    name: 'Invoicing',
    tooltip: 'Create invoices and calculate rates',
    tools: [
      { id: 'invoice-generator', Tool: InvoiceGenerator, span: { col: 6, row: 1 }, featured: true },
      { id: 'rate-calculator', Tool: RateCalculator, span: { col: 6, row: 1 } },
      { id: 'tax-estimator', Tool: TaxEstimator, span: { col: 6, row: 1 } },
    ],
  },
  {
    id: 'time-expenses',
    name: 'Time & Expenses',
    tooltip: 'Track time and business expenses',
    tools: [
      { id: 'time-tracker', Tool: TimeTracker, span: { col: 6, row: 1 } },
      { id: 'expense-tracker', Tool: ExpenseTracker, span: { col: 6, row: 1 } },
      { id: 'timezone-converter', Tool: TimezoneConverter, span: { col: 6, row: 1 } },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tooltip: 'Contracts and client management',
    tools: [
      { id: 'contract-templates', Tool: ContractTemplates, span: { col: 6, row: 1 } },
      { id: 'client-manager', Tool: ClientManager, span: { col: 6, row: 1 } },
    ],
  },
];

const ALL_TOOLS: ToolRegistryEntry[] = CATEGORIES.flatMap(cat =>
  cat.tools.map(t => ({ ...t, category: cat.id, categoryName: cat.name }))
);

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'invoice-generator': 'Create professional invoices with line items, totals, and tax.',
  'rate-calculator': 'Calculate hourly and daily rates with overhead and tax.',
  'time-tracker': 'Track time with a live timer or manual entry.',
  'expense-tracker': 'Log and categorize business expenses.',
  'contract-templates': 'Pre-built contract templates with variable inputs.',
  'client-manager': 'Organize client information and project notes.',
  'tax-estimator': 'Estimate US federal income tax by bracket with effective rate.',
  'timezone-converter': 'Convert times across multiple time zones with meeting planner.',
};

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class FreelanceCore {
  private workspace: HTMLElement;
  private moduleId = 'freelance-core';
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

    const saved = await db.getPreference('fc-favorites', []) as string[];
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
        <img src="/banners/freelance-core.svg" alt="Freelance Core — Freelancer Productivity Tools" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Freelance Core</h1>
        <p class="module-header__desc">Invoicing, time tracking, expenses, contracts, and client management.</p>
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
    } else {
      this.favorites.add(toolId);
    }
    db.setPreference('fc-favorites', Array.from(this.favorites));
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

    const tipsData = getFreelanceCoreToolInfo(toolId);
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
    if (document.getElementById('freelance-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'freelance-core-styles';
    style.textContent = `
      .fcinv-header {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .fcinv-items {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }
      .fcinv-item {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }
      .fcinv-item__amount {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--accent);
        min-width: 80px;
        text-align: right;
      }
      .fcinv-totals {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--border-hairline);
      }
      .fcinv-totals__values {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        text-align: right;
      }
      .fcinv-totals__values span {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
      }
      .fcinv-total span {
        font-size: var(--text-lg) !important;
        color: var(--accent);
        font-weight: 500;
      }
      .fcr-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .fcr-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
      }
      .fcr-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-4);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
        text-align: center;
      }
      .fcr-card__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: var(--space-1);
      }
      .fcr-card__value {
        font-size: var(--text-xl);
        font-family: var(--font-mono);
        color: var(--accent);
        font-weight: 500;
      }
      .fctt-controls {
        display: flex;
        gap: var(--space-4);
        align-items: flex-end;
        margin-bottom: var(--space-4);
      }
      .fctt-timer {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .fctt-timer__display {
        font-family: var(--font-mono);
        font-size: var(--text-2xl);
        color: var(--accent);
        min-width: 120px;
      }
      .fctt-total {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin-bottom: var(--space-3);
      }
      .fctt-entry {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--border-hairline);
      }
      .fctt-entry__project {
        flex: 1;
        font-size: var(--text-sm);
      }
      .fctt-entry__duration {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--accent);
      }
      .fctt-entry__date {
        font-size: var(--text-xs);
        color: var(--text-ghost);
      }
      .fce-form {
        display: flex;
        gap: var(--space-3);
        align-items: flex-end;
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }
      .fce-summary {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        padding: var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
      }
      .fce-total {
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        color: var(--accent);
      }
      .fce-breakdown {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }
      .fce-badge {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-pill);
        color: var(--text-secondary);
      }
      .fce-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--border-hairline);
      }
      .fce-item__cat {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        background: var(--accent-dim);
        color: var(--accent);
        border-radius: var(--radius-pill);
      }
      .fce-item__desc {
        flex: 1;
        font-size: var(--text-sm);
      }
      .fce-item__amount {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
      }
      .fce-item__date {
        font-size: var(--text-xs);
        color: var(--text-ghost);
      }
      .fcct-vars {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .fccl-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: var(--space-4);
      }
      .fccl-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        max-height: 500px;
        overflow-y: auto;
      }
      .fccl-client {
        padding: var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: border-color 150ms ease;
      }
      .fccl-client:hover {
        border-color: var(--border-subtle);
      }
      .fccl-client__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .fccl-client__name {
        font-size: var(--text-sm);
        font-weight: 500;
      }
      .fccl-client__status {
        font-size: var(--text-xs);
        text-transform: uppercase;
      }
      .fccl-client__company {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .fccl-client__actions {
        display: flex;
        gap: var(--space-1);
        margin-top: var(--space-2);
      }
      .fci-layout {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: var(--space-6);
        align-items: start;
      }
      .fci-form { display: flex; flex-direction: column; gap: var(--space-3); }
      .fci-section-title {
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding-top: var(--space-3);
        border-top: 1px solid var(--border-hairline);
        margin-top: var(--space-2);
      }
      .fci-section-title:first-child { border-top: none; padding-top: 0; margin-top: 0; }
      .fci-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
      .fci-preview-col { position: sticky; top: 80px; display: flex; flex-direction: column; gap: var(--space-3); }
      .fci-paper {
        background: #faf9f6;
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        overflow: hidden;
        aspect-ratio: 210 / 297;
        color: #1a1a1a;
        font-family: 'Georgia', serif;
        font-size: 11px;
        line-height: 1.5;
      }
      .fci-paper__inner { padding: 32px; height: 100%; display: flex; flex-direction: column; }
      .fci-paper__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .fci-paper__header-left { display: flex; gap: 12px; align-items: center; }
      .fci-paper__logo { max-width: 64px; max-height: 64px; border-radius: 4px; }
      .fci-paper__from { font-size: 10px; color: #666; }
      .fci-paper__from strong { color: #1a1a1a; font-size: 12px; }
      .fci-paper__header-right { text-align: right; }
      .fci-paper__title { font-size: 24px; font-weight: 700; letter-spacing: 0.05em; color: #1a1a1a; }
      .fci-paper__number { font-size: 11px; color: #888; margin-top: 2px; }
      .fci-paper__dates { font-size: 10px; color: #666; margin-top: 8px; display: flex; flex-direction: column; gap: 2px; }
      .fci-paper__to { margin-bottom: 20px; }
      .fci-paper__to-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
      .fci-paper__table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      .fci-paper__table th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; text-align: left; padding: 6px 8px; border-bottom: 2px solid #ddd; }
      .fci-paper__table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; }
      .fci-paper__table .fci-num { text-align: right; font-family: var(--font-mono); font-size: 10px; }
      .fci-paper__table th.fci-num { text-align: right; }
      .fci-paper__totals { margin-left: auto; width: 200px; }
      .fci-paper__totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #555; }
      .fci-paper__totals-row--total { font-size: 14px; font-weight: 700; color: #1a1a1a; border-top: 2px solid #ddd; padding-top: 8px; margin-top: 4px; }
      .fci-paper__notes { margin-top: auto; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #888; font-style: italic; }
      .fci-history { margin-top: var(--space-2); }
      .fci-history-toggle {
        display: flex; align-items: center; justify-content: space-between; width: 100%;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep); border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted);
        cursor: pointer; transition: border-color 150ms ease;
      }
      .fci-history-toggle:hover { border-color: var(--border-subtle); color: var(--text-secondary); }
      .fci-history-list { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-2); max-height: 200px; overflow-y: auto; }
      .fci-history-item {
        display: flex; align-items: center; gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep); border: 1px solid var(--border-hairline); border-radius: var(--radius-sm);
        cursor: pointer; transition: border-color 150ms ease; font-size: var(--text-xs);
      }
      .fci-history-item:hover { border-color: var(--accent-border); }
      .fci-history-item__name { flex: 1; color: var(--text-primary); }
      .fci-history-item__date { color: var(--text-ghost); font-family: var(--font-mono); }
      .fci-history-item__num { color: var(--text-muted); font-family: var(--font-mono); }
      .tax-controls { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--space-4); }
      .tax-result { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
      .tax-stat { display: flex; flex-direction: column; align-items: center; padding: var(--space-3); background: var(--bg-deep); border-radius: var(--radius-md); }
      .tax-stat__label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; }
      .tax-stat__value { font-size: var(--text-lg); font-family: var(--font-mono); color: var(--accent); font-weight: 500; }
      .tax-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: var(--space-4); }
      .tax-bar__segment { height: 100%; transition: width 200ms ease; }
      .tax-breakdown { display: flex; flex-direction: column; gap: var(--space-1); }
      .tax-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--bg-deep); border-radius: var(--radius-sm); font-size: var(--text-xs); }
      .tax-row__rate { font-family: var(--font-mono); font-weight: 600; min-width: 32px; }
      .tax-row__range { flex: 1; color: var(--text-muted); font-family: var(--font-mono); }
      .tax-row__amount { font-family: var(--font-mono); color: var(--accent); }
      .tz-controls { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; margin-bottom: var(--space-4); }
      .tz-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
      .tz-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3); background: var(--bg-deep); border-radius: var(--radius-md); border: 1px solid var(--border-hairline); }
      .tz-time { font-family: var(--font-mono); font-size: var(--text-lg); color: var(--accent); font-weight: 500; text-align: center; }
      .tz-offset { font-size: var(--text-xs); color: var(--text-ghost); text-align: center; }
      @media (max-width: 1024px) {
        .fci-layout { grid-template-columns: 1fr; }
        .fci-preview-col { position: static; }
      }
      @media (max-width: 768px) {
        .fcinv-header, .fcr-grid, .fcct-vars, .fccl-layout {
          grid-template-columns: 1fr;
        }
        .fcr-cards {
          grid-template-columns: repeat(2, 1fr);
        }
        .fctt-controls, .fce-form {
          flex-direction: column;
          align-items: stretch;
        }
        .tax-result { grid-template-columns: repeat(2, 1fr); }
        .tz-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media print {
        @page { size: A4; margin: 20mm; }
        html, body {
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        #cosmos, #topbar, .orb, .side-nav,
        .tool-view__header, .tool-actions,
        .fci-form, .fci-history,
        .fci-preview-col > *:not(.fci-paper) {
          display: none !important;
        }
        .tool-view {
          position: static !important;
          background: white !important;
        }
        .tool-view__content {
          padding: 0 !important;
          max-width: 100% !important;
          overflow: visible !important;
        }
        .fci-layout {
          display: block !important;
        }
        .fci-paper {
          position: static !important;
          width: 100% !important;
          aspect-ratio: auto !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          border: none !important;
          background: white !important;
        }
        .fci-paper__inner {
          padding: 0 !important;
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
