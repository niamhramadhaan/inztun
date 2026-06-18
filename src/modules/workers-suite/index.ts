import { ToolView } from '../../components/ToolView';
import { ModuleToolbar } from '../../components/ModuleToolbar';
import { createToolCard, createTipsPanel, createCategorySection } from '../../components/ModuleHelpers';
import type { Category } from '../../components/ModuleHelpers';
import { router } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { Toast } from '../../components/Toast';
import { getToolInfo } from './tool-data';
import type { Tool, ToolClass, ToolRegistryEntry, SortMode, ToolViewOptions } from '../../types/index';

import { JsonFormatter } from './tools/json-formatter';
import { Base64Tool } from './tools/base64';
import { HashGenerator } from './tools/hash-generator';
import { UuidGenerator } from './tools/uuid-generator';
import { LoremIpsum } from './tools/lorem-ipsum';
import { CharacterCounter } from './tools/char-counter';
import { UrlEncoder } from './tools/url-encoder';
import { MarkdownPreview } from './tools/markdown-preview';
import { MarkdownToHtml } from './tools/markdown-html';
import { PasswordGenerator } from './tools/password-gen';
import { CssUnitConverter } from './tools/css-unit';
import { Scratchpad } from './tools/scratchpad';
import { PdfMerge } from './tools/pdf-merge';
import { PdfSplit } from './tools/pdf-split';
import { PdfCompress } from './tools/pdf-compress';
import { PdfProtect } from './tools/pdf-protect';
import { PdfSign } from './tools/pdf-sign';
import { PdfToImages } from './tools/pdf-to-images';
import { PdfMetadata } from './tools/pdf-metadata';

const CATEGORIES: Category[] = [
  {
    id: 'text',
    name: 'Text & Writing',
    tooltip: 'Text manipulation, case conversion, and writing utilities',
    tools: [
      { id: 'lorem-ipsum', Tool: LoremIpsum, span: { col: 4, row: 1 } },
      { id: 'char-counter', Tool: CharacterCounter, span: { col: 4, row: 1 } },
    ],
  },
  {
    id: 'encoding',
    name: 'Encoding & Decoding',
    tooltip: 'Encode and decode data in various formats',
    tools: [
      { id: 'base64', Tool: Base64Tool, span: { col: 4, row: 1 } },
      { id: 'url-encoder', Tool: UrlEncoder, span: { col: 4, row: 1 } },
    ],
  },
  {
    id: 'data',
    name: 'Data & Format',
    tooltip: 'Format, validate, and transform structured data',
    tools: [
      { id: 'json-formatter', Tool: JsonFormatter, span: { col: 6, row: 1 }, featured: true },
    ],
  },
  {
    id: 'markdown',
    name: 'Markdown',
    tooltip: 'Write, preview, and convert markdown content',
    tools: [
      { id: 'markdown-preview', Tool: MarkdownPreview, span: { col: 8, row: 2 } },
      { id: 'markdown-html', Tool: MarkdownToHtml, span: { col: 4, row: 1 } },
    ],
  },
  {
    id: 'generators',
    name: 'Generators',
    tooltip: 'Generate unique identifiers, hashes, and passwords',
    tools: [
      { id: 'uuid-generator', Tool: UuidGenerator, span: { col: 4, row: 1 } },
      { id: 'hash-generator', Tool: HashGenerator, span: { col: 4, row: 1 } },
      { id: 'password-gen', Tool: PasswordGenerator, span: { col: 4, row: 1 } },
    ],
  },
  {
    id: 'devtools',
    name: 'Developer Utilities',
    tooltip: 'Unit conversions and CSS tools',
    tools: [
      { id: 'css-unit', Tool: CssUnitConverter, span: { col: 4, row: 1 } },
      { id: 'scratchpad', Tool: Scratchpad, span: { col: 8, row: 2 } },
    ],
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    tooltip: 'Merge, split, compress, sign, and convert PDF documents',
    tools: [
      { id: 'pdf-merge', Tool: PdfMerge, span: { col: 6, row: 1 }, featured: true },
      { id: 'pdf-split', Tool: PdfSplit, span: { col: 6, row: 1 } },
      { id: 'pdf-compress', Tool: PdfCompress, span: { col: 4, row: 1 } },
      { id: 'pdf-protect', Tool: PdfProtect, span: { col: 4, row: 1 } },
      { id: 'pdf-sign', Tool: PdfSign, span: { col: 4, row: 1 } },
      { id: 'pdf-to-images', Tool: PdfToImages, span: { col: 6, row: 1 } },
      { id: 'pdf-metadata', Tool: PdfMetadata, span: { col: 6, row: 1 } },
    ],
  },
];

const ALL_TOOLS: ToolRegistryEntry[] = CATEGORIES.flatMap(cat =>
  cat.tools.map(t => ({ ...t, category: cat.id, categoryName: cat.name }))
);

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'json-formatter': 'Pretty-print, minify, and validate JSON data.',
  'base64': 'Encode and decode Base64 strings.',
  'hash-generator': 'Generate SHA-256, SHA-1, and MD5 hashes.',
  'uuid-generator': 'Generate v4 UUIDs in bulk.',
  'lorem-ipsum': 'Generate placeholder text for designs.',
  'char-counter': 'Count characters, words, lines, sentences, reading time.',
  'url-encoder': 'Encode/decode URLs and parse URL structure.',
  'markdown-preview': 'Live markdown preview with GFM support.',
  'markdown-html': 'Convert markdown to clean HTML.',
  'password-gen': 'Generate secure passwords with customizable options.',
  'css-unit': 'Convert between px, rem, em, vw, vh, and more.',
  'scratchpad': 'Markdown notes with auto-save, search, and client/project linking.',
  'pdf-merge': 'Combine multiple PDF files into one with drag-to-reorder.',
  'pdf-split': 'Extract specific pages or split every page into individual PDFs.',
  'pdf-compress': 'Reduce PDF file size by stripping unused objects and metadata.',
  'pdf-protect': 'Add or remove password protection from PDF files.',
  'pdf-sign': 'Place a visual signature on PDF — draw, type, or upload.',
  'pdf-to-images': 'Convert PDF pages to PNG images at configurable DPI.',
  'pdf-metadata': 'View and edit PDF metadata — title, author, keywords, and more.',
};

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class WorkerSuite {
  private workspace: HTMLElement;
  private moduleId = 'workers-suite';
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

    const saved = await db.getPreference('ws-favorites', []) as string[];
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
        <img src="/banners/workers-suite.svg" alt="inztun — The Artisan's Operating System" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">Worker's Suite</h1>
        <p class="module-header__desc">General-purpose developer utilities. All processing happens locally in your browser.</p>
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
      db.setPreference('ws-favorites', Array.from(this.favorites));
      Toast.info('Removed from favorites');
    } else {
      this.favorites.add(toolId);
      db.setPreference('ws-favorites', Array.from(this.favorites));
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
      requestAnimationFrame(() => instance.tool.init?.(instance.view.contentEl!));
      instance.initialized = true;
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

    const tipsData = getToolInfo(toolId);
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
    if (document.getElementById('module-styles')) return;
    const style = document.createElement('style');
    style.id = 'module-styles';
    style.textContent = `
      .tool-workspace {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        flex: 1;
        min-height: min-content;
      }

      .tool-area {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        flex: 1;
        min-height: min-content;
      }

      .tool-area__input, .tool-area__output { flex: 1; min-height: 0; }

      .tool-actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: var(--space-3);
        border-top: 1px solid var(--border-hairline);
      }

      .tool-split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        flex: 1;
      }

      @media (max-width: 768px) {
        .tool-split { grid-template-columns: 1fr; }
      }

      .color-preview {
        width: 100%;
        height: 80px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline);
        transition: background var(--duration-normal) var(--ease-smooth);
      }

      .color-values { display: flex; flex-direction: column; gap: var(--space-2); }

      .color-value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
      }

      .color-value__label { color: var(--text-muted); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; }
      .color-value__text { font-family: var(--font-mono); color: var(--text-primary); }

      .hash-result { display: flex; flex-direction: column; gap: var(--space-2); }

      .hash-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
      }

      .hash-item__label { font-size: var(--text-xs); color: var(--text-muted); min-width: 60px; }
      .hash-item__value { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-primary); word-break: break-all; flex: 1; }

      .uuid-list { display: flex; flex-direction: column; gap: var(--space-2); }

      .uuid-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
      }

      .uuid-controls, .lorem-controls {
        display: flex;
        gap: var(--space-3);
        align-items: flex-end;
      }

      .timestamp-display { text-align: center; padding: var(--space-4); }
      .timestamp-display__value { font-family: var(--font-mono); font-size: var(--text-2xl); color: var(--accent); margin-bottom: var(--space-1); }
      .timestamp-display__relative { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-1); font-style: italic; }
      .timestamp-display__label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

      .lorem-output {
        font-family: var(--font-display);
        font-size: var(--text-base);
        line-height: 1.8;
        color: var(--text-secondary);
        max-height: 300px;
        overflow-y: auto;
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-1);
      }

      .char-count {
        font-size: var(--text-xs);
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }

      .color-picker-row {
        display: flex;
        align-items: flex-end;
        gap: var(--space-3);
      }

      .color-native-picker {
        width: 48px;
        height: 40px;
        padding: 2px;
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        cursor: pointer;
      }

      .color-native-picker::-webkit-color-swatch-wrapper { padding: 0; }
      .color-native-picker::-webkit-color-swatch { border: none; border-radius: var(--radius-sm); }

      .case-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--space-2);
      }

      .case-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 150ms ease;
      }

      .case-item:hover { border-color: var(--border-subtle); }
      .case-item--selected { border-color: var(--accent); background: var(--accent-dim); }

      .case-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        min-width: 80px;
      }

      .case-value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: var(--space-2);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
      }

      .stat-value {
        font-family: var(--font-mono);
        font-size: var(--text-xl);
        color: var(--accent);
        font-weight: 500;
      }

      .stat-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: var(--space-1);
      }

      .url-parts {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
      }

      .url-part {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .url-part__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        min-width: 80px;
        text-transform: uppercase;
      }

      .url-part__value {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .url-params {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }

      .url-param {
        padding: 2px 6px;
        background: var(--bg-glass);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
      }

      .jwt-parts {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .jwt-section {
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .jwt-section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-glass);
        border-bottom: 1px solid var(--border-hairline);
      }

      .jwt-section__title {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .jwt-code {
        padding: var(--space-3);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        margin: 0;
        overflow-x: auto;
      }

      .jwt-meta {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
      }

      .jwt-meta__item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .jwt-meta__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .jwt-meta__value {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .jwt-meta__value--expired {
        color: var(--color-error);
      }

      .jwt-error {
        padding: var(--space-3);
        color: var(--color-error);
        font-size: var(--text-sm);
      }

      .md-split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        flex: 1;
        min-height: 400px;
      }

      .md-editor, .md-preview {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .md-textarea {
        flex: 1;
        min-height: 300px;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
      }

      .md-output {
        flex: 1;
        padding: var(--space-4);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        overflow-y: auto;
        font-size: var(--text-sm);
        line-height: 1.6;
      }

      .md-output h1, .md-output h2, .md-output h3 {
        margin-top: var(--space-4);
        margin-bottom: var(--space-2);
      }

      .md-output h1 { font-size: var(--text-2xl); border-bottom: 1px solid var(--border-hairline); padding-bottom: var(--space-2); }
      .md-output h2 { font-size: var(--text-xl); }
      .md-output h3 { font-size: var(--text-lg); }

      .md-output p { margin-bottom: var(--space-2); }

      .md-output code {
        padding: 2px 4px;
        background: var(--bg-glass);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: 0.9em;
      }

      .md-output pre {
        padding: var(--space-3);
        background: var(--bg-void);
        border-radius: var(--radius-md);
        overflow-x: auto;
      }

      .md-output pre code {
        background: transparent;
        padding: 0;
      }

      .md-output blockquote {
        border-left: 3px solid var(--accent);
        padding-left: var(--space-3);
        color: var(--text-muted);
        margin: var(--space-2) 0;
      }

      .md-output ul, .md-output ol {
        padding-left: var(--space-4);
        margin-bottom: var(--space-2);
      }

      .md-output li { margin-bottom: var(--space-1); }

      .md-output table {
        width: 100%;
        border-collapse: collapse;
        margin: var(--space-2) 0;
      }

      .md-output td, .md-output th {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--border-hairline);
        text-align: left;
      }

      .md-output th {
        background: var(--bg-glass);
        font-weight: 600;
      }

      .md-output img { max-width: 100%; border-radius: var(--radius-md); }
      .md-output hr { border: none; border-top: 1px solid var(--border-hairline); margin: var(--space-4) 0; }

      @media (max-width: 768px) {
        .md-split { grid-template-columns: 1fr; }
      }

      .password-display {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
      }

      .password-output {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        color: var(--accent);
        word-break: break-all;
      }

      .password-strength {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .strength-bar {
        display: flex;
        gap: 2px;
        flex: 1;
      }

      .strength-segment {
        height: 4px;
        flex: 1;
        border-radius: 2px;
        transition: background 200ms ease;
      }

      .strength-label {
        font-size: var(--text-xs);
        font-weight: 500;
        min-width: 80px;
        text-align: right;
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

      .password-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-secondary);
        cursor: pointer;
      }

      .checkbox-label input[type="checkbox"] {
        accent-color: var(--accent);
      }

      .password-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .password-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
      }

      .password-item__value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        word-break: break-all;
      }

      .base-results {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .base-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
      }

      .base-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        min-width: 120px;
      }

      .base-value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        word-break: break-all;
      }

      .base-error {
        padding: var(--space-3);
        color: var(--color-error);
        font-size: var(--text-sm);
      }

      .unit-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: var(--space-2);
      }

      .unit-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-sm);
      }

      .unit-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        min-width: 40px;
      }

      .unit-value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-12);
        color: var(--text-muted);
        text-align: center;
        grid-column: 1 / -1;
      }

      .empty-state svg {
        opacity: 0.3;
      }

      .tdiff-output {
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        overflow: auto;
        max-height: 400px;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        line-height: 1.6;
        margin-top: var(--space-4);
      }
      .tdiff-line { padding: 2px var(--space-3); white-space: pre-wrap; word-break: break-all; }
      .tdiff-line--added { background: rgba(74, 222, 128, 0.1); color: var(--color-success); }
      .tdiff-line--removed { background: rgba(248, 113, 113, 0.1); color: var(--color-error); }
      .tdiff-line--unchanged { color: var(--text-ghost); }
      .tdiff-prefix { display: inline-block; width: 1.5em; text-align: center; color: var(--text-ghost); user-select: none; }

      .cron-fields {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }
      .cron-desc {
        padding: var(--space-3);
        background: var(--bg-deep);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        color: var(--accent);
        text-align: center;
        margin-bottom: var(--space-4);
      }
      .cron-next-item {
        padding: var(--space-2) var(--space-3);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-hairline);
      }
      .cron-next-item:last-child { border-bottom: none; }

      /* ── Scratchpad ── */
      .sp-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: var(--space-3);
        min-height: 500px;
      }
      .sp-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        overflow: hidden;
      }
      .sp-sidebar__header {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .sp-search {
        font-size: var(--text-xs) !important;
        padding: var(--space-1) var(--space-2) !important;
      }
      .sp-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .sp-note-item {
        padding: var(--space-2);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background 150ms ease;
        border: 1px solid transparent;
      }
      .sp-note-item:hover {
        background: var(--bg-glass);
      }
      .sp-note-item--active {
        background: var(--accent-dim);
        border-color: var(--accent-border);
      }
      .sp-note-item__title {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sp-note-item__meta {
        display: flex;
        gap: var(--space-2);
        font-size: var(--text-xs);
        color: var(--text-ghost);
        margin-top: 2px;
      }
      .sp-note-item__tag {
        color: var(--accent);
        font-size: 8px;
      }
      .sp-note-item__preview {
        font-size: var(--text-xs);
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      }
      .sp-inline-rename {
        font-size: var(--text-sm) !important;
        padding: 0 var(--space-1) !important;
        width: 100%;
      }
      .sp-editor {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        min-height: 500px;
      }
      .sp-editor__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: var(--text-muted);
        gap: var(--space-3);
      }
      .sp-editor__active {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        flex: 1;
      }
      .sp-editor__toolbar {
        display: flex;
        gap: var(--space-2);
        align-items: center;
        flex-wrap: wrap;
      }
      .sp-title {
        flex: 1;
        font-weight: 500;
      }
      .sp-editor__actions {
        display: flex;
        gap: var(--space-1);
        align-items: center;
      }
      .sp-saved {
        font-size: var(--text-xs);
        color: var(--color-success);
        opacity: 0;
        transition: opacity 300ms ease;
      }
      .sp-saved--visible {
        opacity: 1;
      }
      .sp-insert-btns {
        display: flex;
        gap: 2px;
      }
      .sp-insert {
        min-width: 28px;
        padding: var(--space-1) !important;
        font-family: var(--font-mono);
        font-size: var(--text-xs) !important;
      }
      .sp-editor__link-row {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }
      .sp-editor__link-row .label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        white-space: nowrap;
      }
      .sp-link-select {
        font-size: var(--text-xs) !important;
        padding: var(--space-1) var(--space-2) !important;
        max-width: 180px;
      }
      .sp-textarea {
        flex: 1;
        min-height: 300px;
        resize: vertical;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
      }
      .sp-preview {
        flex: 1;
        min-height: 300px;
        overflow-y: auto;
        padding: var(--space-3);
        background: var(--bg-surface);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
      }
      .sp-check {
        padding: var(--space-1) 0;
        color: var(--text-muted);
      }
      .sp-check--done {
        color: var(--text-ghost);
        text-decoration: line-through;
      }
      @media (max-width: 768px) {
        .sp-layout {
          grid-template-columns: 1fr;
        }
        .sp-sidebar {
          max-height: 200px;
        }
      }

      /* ── PDF Tools ── */
      .pdf-drop-zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8) var(--space-4);
        border: 2px dashed var(--border-hairline);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 200ms ease;
        color: var(--text-muted);
        text-align: center;
        min-height: 200px;
      }
      .pdf-drop-zone:hover { border-color: var(--accent); color: var(--text-secondary); }
      .pdf-drop-zone--active { border-color: var(--accent); background: var(--accent-dim); }
      .pdf-drop-hint { font-size: var(--text-xs); color: var(--text-ghost); }

      .pdf-file-list { display: flex; flex-direction: column; gap: var(--space-2); }
      .pdf-file-item {
        display: flex; align-items: center; gap: var(--space-3);
        padding: var(--space-3); background: var(--bg-deep);
        border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
        cursor: grab; transition: all 150ms ease;
      }
      .pdf-file-item:hover { border-color: var(--border-subtle); }
      .pdf-file-item--dragging { opacity: 0.5; border-color: var(--accent); }
      .pdf-file-handle { color: var(--text-ghost); cursor: grab; font-size: var(--text-lg); }
      .pdf-file-icon { font-size: 1.5rem; }
      .pdf-file-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .pdf-file-name { font-size: var(--text-sm); color: var(--text-primary); }
      .pdf-file-meta { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
      .pdf-file-remove { color: var(--text-muted); }
      .pdf-file-remove:hover { color: var(--color-error); }

      .pdf-info-bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep); border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); margin-bottom: var(--space-3);
        font-size: var(--text-sm); color: var(--text-secondary);
        font-family: var(--font-mono);
      }

      .pdf-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }

      .pdf-note {
        font-size: var(--text-xs); color: var(--text-ghost);
        padding: var(--space-2) var(--space-3); background: var(--bg-deep);
        border-radius: var(--radius-sm); margin-top: var(--space-2);
        line-height: 1.5;
      }

      /* Split */
      .pdf-split-thumbs { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-3) 0; }
      .pdf-thumb {
        position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
        padding: var(--space-2); border: 2px solid transparent;
        border-radius: var(--radius-md); cursor: pointer; transition: all 150ms ease;
      }
      .pdf-thumb:hover { border-color: var(--border-subtle); background: var(--bg-deep); }
      .pdf-thumb--selected { border-color: var(--accent); background: var(--accent-dim); }
      .pdf-thumb-canvas { border-radius: var(--radius-sm); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .pdf-thumb-label { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
      .pdf-thumb-check {
        position: absolute; top: 6px; left: 6px;
        accent-color: var(--accent); z-index: 2;
        width: 16px; height: 16px; cursor: pointer;
      }
      .pdf-select-actions { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); }
      .pdf-split-info { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-2); }

      /* Compress */
      .pdf-compress-info {
        display: flex; align-items: center; gap: var(--space-4);
        padding: var(--space-4); background: var(--bg-deep);
        border-radius: var(--radius-lg); margin-bottom: var(--space-3);
        flex-wrap: wrap; justify-content: center;
      }
      .pdf-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .pdf-stat-label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .pdf-stat-value { font-size: var(--text-lg); font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
      .pdf-stat-value--accent { color: var(--accent); }
      .pdf-stat-arrow { font-size: var(--text-xl); color: var(--text-ghost); }

      /* Protect */
      .pdf-protect-controls { display: flex; flex-direction: column; gap: var(--space-3); }

      /* Sign */
      .pdf-sign-layout { display: grid; grid-template-columns: 1fr 300px; gap: var(--space-4); align-items: start; }
      @media (max-width: 768px) { .pdf-sign-layout { grid-template-columns: 1fr; } }
      .pdf-sign-preview-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
      .pdf-sign-preview {
        position: relative; overflow: hidden; border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline); background: var(--bg-deep);
      }
      .pdf-sign-canvas { width: 100%; height: auto; display: block; }
      .pdf-sign-overlay {
        position: absolute;
        min-width: 40px; min-height: 20px;
        border: 2px dashed var(--accent);
        border-radius: var(--radius-sm); cursor: move;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.8); touch-action: none;
      }
      .pdf-sign-loading {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.5); color: var(--text-primary);
        font-size: var(--text-sm); border-radius: var(--radius-md);
        z-index: 5;
      }
      .pdf-sign-sig-img { max-width: 100%; max-height: 100%; object-fit: contain; pointer-events: none; }
      .pdf-sign-sig-placeholder { font-size: var(--text-xs); color: var(--text-ghost); pointer-events: none; }
      .pdf-sig-handle {
        position: absolute; width: 10px; height: 10px;
        background: var(--accent); border: 1px solid var(--bg-surface);
        border-radius: 2px; z-index: 2;
      }
      .pdf-sig-handle--nw { top: -5px; left: -5px; cursor: nw-resize; }
      .pdf-sig-handle--ne { top: -5px; right: -5px; cursor: ne-resize; }
      .pdf-sig-handle--sw { bottom: -5px; left: -5px; cursor: sw-resize; }
      .pdf-sig-handle--se { bottom: -5px; right: -5px; cursor: se-resize; }
      .pdf-sig-dims { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); text-align: center; }
      .pdf-sign-options { display: flex; flex-direction: column; gap: var(--space-3); }
      .pdf-sign-tabs { display: flex; gap: var(--space-1); }
      .pdf-sign-tab.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
      .pdf-sign-draw { display: flex; flex-direction: column; gap: var(--space-2); }
      .pdf-sign-draw-canvas {
        width: 100%; height: 100px; border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md); background: white; cursor: crosshair; touch-action: none;
      }
      .pdf-sign-type { display: flex; flex-direction: column; gap: var(--space-2); }

      /* To Images */
      .pdf-images-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-3); }
      .pdf-images-thumbs { display: flex; flex-wrap: wrap; gap: var(--space-3); }
      .pdf-image-thumb {
        display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
        padding: var(--space-2); background: var(--bg-deep);
        border: 1px solid var(--border-hairline); border-radius: var(--radius-md);
      }
      .pdf-image-thumb canvas { border-radius: var(--radius-sm); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .pdf-image-thumb-label { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); text-align: center; }

      /* Metadata */
      .pdf-metadata-info {
        padding: var(--space-3); background: var(--bg-deep);
        border-radius: var(--radius-lg); margin-bottom: var(--space-3);
      }
      .pdf-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-3); }
      .pdf-info-item { display: flex; flex-direction: column; gap: 2px; }
      .pdf-info-label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .pdf-info-value { font-size: var(--text-sm); font-family: var(--font-mono); color: var(--text-primary); }
      .pdf-metadata-fields { display: flex; flex-direction: column; gap: var(--space-3); }

      /* ── PDF Preview (shared) ── */
      .pdf-preview-canvas {
        max-width: 100%;
        max-height: 400px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline);
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        display: block;
        margin-bottom: var(--space-3);
        background: white;
      }
      .pdf-merge-thumb {
        width: 40px;
        height: 52px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-hairline);
        object-fit: cover;
        flex-shrink: 0;
        background: white;
      }
      .pdf-split-preview {
        margin: var(--space-3) 0;
        text-align: center;
      }
      .pdf-split-preview canvas {
        max-width: 100%;
        max-height: 500px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline);
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        background: white;
      }
      .pdf-images-preview {
        margin: var(--space-3) 0;
        text-align: center;
      }
      .pdf-images-preview canvas {
        max-width: 100%;
        max-height: 500px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-hairline);
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        background: white;
      }
      .pdf-preview-label {
        display: block;
        font-size: var(--text-xs);
        color: var(--text-muted);
        font-family: var(--font-mono);
        margin-top: var(--space-1);
      }
      .pdf-sign-page-nav {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }
      .pdf-sign-page-nav button {
        padding: var(--space-1) var(--space-2);
      }
      .pdf-sign-page-nav span {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-secondary);
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
