import { Tile } from '../../components/Tile.js';
import { ToolView } from '../../components/ToolView.js';
import { router } from '../../core/router.js';
import { events } from '../../core/events.js';
import { getPlaygroundToolInfo } from './tool-data.js';

import { TypingTest } from './tools/typing-test.js';
import { ZalgoText } from './tools/zalgo-text.js';
import { FlipText } from './tools/flip-text.js';
import { LeetSpeak } from './tools/leet-speak.js';
import { MorseCode } from './tools/morse-code.js';
import { AsciiArt } from './tools/ascii-art.js';

const TOOL_REGISTRY = [
  { id: 'typing-test', Tool: TypingTest, span: { col: 6, row: 1 }, featured: true },
  { id: 'ascii-art', Tool: AsciiArt, span: { col: 6, row: 1 } },
  { id: 'zalgo-text', Tool: ZalgoText, span: { col: 4, row: 1 } },
  { id: 'flip-text', Tool: FlipText, span: { col: 4, row: 1 } },
  { id: 'leet-speak', Tool: LeetSpeak, span: { col: 4, row: 1 } },
  { id: 'morse-code', Tool: MorseCode, span: { col: 6, row: 1 } },
];

const TOOL_DESCRIPTIONS = {
  'typing-test': 'Test your typing speed with WPM and accuracy tracking.',
  'zalgo-text': 'Generate creepy zalgo text with adjustable intensity.',
  'flip-text': 'Flip text upside down for fun social media posts.',
  'leet-speak': 'Convert text to 1337 speak in simple or advanced mode.',
  'morse-code': 'Encode and decode Morse code with audio playback.',
  'ascii-art': 'Generate ASCII art text banners.',
};

export class Playground {
  constructor(workspace) {
    this.workspace = workspace;
    this.moduleId = 'playground';
    this.toolInstances = new Map();
    this.activeToolId = null;
    this.gridView = null;
    this.container = null;
  }

  render() {
    this.workspace.className = 'workspace';
    this.addModuleStyles();

    this.container = document.createElement('div');
    this.container.className = 'module-container';
    this.container.style.gridColumn = '1 / -1';
    this.workspace.appendChild(this.container);

    this.renderGrid();

    this._routeHandler = ({ current }) => {
      if (current.module !== this.moduleId) return;
      if (current.tool) this.showTool(current.tool);
      else this.hideTool();
    };
    events.on('route:change', this._routeHandler);

    const route = router.getRoute();
    if (route.module === this.moduleId && route.tool) this.showTool(route.tool);
  }

  renderGrid() {
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

    const grid = document.createElement('div');
    grid.className = 'bento-grid';
    TOOL_REGISTRY.forEach(({ id, Tool, span, featured }, index) => {
      const tool = new Tool();
      grid.appendChild(this.createToolCard(id, tool, span, featured, index));
    });
    this.gridView.appendChild(grid);
    this.container.appendChild(this.gridView);
  }

  createToolCard(toolId, tool, span, featured, index) {
    const card = new Tile({
      title: tool.name,
      icon: tool.icon,
      badge: tool.badge || '',
      content: `<p class="tile__desc">${TOOL_DESCRIPTIONS[toolId] || ''}</p><div class="tile__spacer"></div><span class="tile__open-label">Open →</span>`,
      span,
      featured,
    });

    const element = card.render();
    element.classList.add('tile--clickable');
    element.style.animationDelay = `${index * 60}ms`;
    element.addEventListener('click', () => router.navigate(this.moduleId, toolId));
    return element;
  }

  showTool(toolId) {
    const registry = TOOL_REGISTRY.find(t => t.id === toolId);
    if (!registry) return;

    if (this.gridView) this.gridView.style.display = 'none';

    if (!this.toolInstances.has(toolId)) this.createToolInstance(toolId, registry);

    this.toolInstances.forEach((instance, id) => {
      id === toolId ? instance.view.show() : instance.view.hide();
    });

    const instance = this.toolInstances.get(toolId);
    if (!instance.initialized) {
      requestAnimationFrame(() => instance.tool.init(instance.view.contentEl));
      instance.initialized = true;
    }

    this.activeToolId = toolId;
  }

  createToolInstance(toolId, registry) {
    const tool = new registry.Tool();
    const currentIndex = TOOL_REGISTRY.findIndex(t => t.id === toolId);
    const toolsList = TOOL_REGISTRY.map(t => ({ id: t.id, name: new t.Tool().name }));

    const view = new ToolView(this.container, {
      toolId,
      toolName: tool.name,
      toolIcon: tool.icon,
      moduleId: this.moduleId,
      tools: toolsList,
      currentIndex,
    });

    const contentEl = view.render();
    const toolWorkspace = document.createElement('div');
    toolWorkspace.className = 'tool-workspace';
    toolWorkspace.innerHTML = tool.render();
    contentEl.appendChild(toolWorkspace);

    const tipsData = getPlaygroundToolInfo(toolId);
    if (tipsData.useCases.length || tipsData.tips.length) {
      const tipsPanel = this.createTipsPanel(toolId, tipsData);
      contentEl.appendChild(tipsPanel);
    }

    this.toolInstances.set(toolId, { tool, view, initialized: false });
  }

  createTipsPanel(toolId, data) {
    const panel = document.createElement('div');
    panel.className = 'tips-panel';

    const relatedTools = TOOL_REGISTRY
      .filter(t => data.related.includes(t.id))
      .map(t => `<a class="tips-related__link" data-tool="${t.id}">${new t.Tool().name}</a>`)
      .join('');

    panel.innerHTML = `
      <button class="tips-toggle" aria-expanded="false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Tips & Use Cases</span>
        <svg class="tips-toggle__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="tips-content">
        ${data.useCases.length ? `<div class="tips-section"><h4 class="tips-section__title">Use Cases</h4><ul class="tips-list">${data.useCases.map(uc => `<li>${uc}</li>`).join('')}</ul></div>` : ''}
        ${data.tips.length ? `<div class="tips-section"><h4 class="tips-section__title">Pro Tips</h4><ul class="tips-list">${data.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>` : ''}
        ${relatedTools ? `<div class="tips-section tips-related"><h4 class="tips-section__title">Related Tools</h4><div class="tips-related__links">${relatedTools}</div></div>` : ''}
      </div>
    `;

    const toggle = panel.querySelector('.tips-toggle');
    const content = panel.querySelector('.tips-content');
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      content.style.display = expanded ? 'none' : '';
      panel.classList.toggle('tips-panel--expanded', !expanded);
    });

    panel.querySelectorAll('.tips-related__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate(this.moduleId, link.dataset.tool);
      });
    });

    return panel;
  }

  hideTool() {
    this.toolInstances.forEach(instance => instance.view.hide());
    if (this.gridView) this.gridView.style.display = '';
    this.activeToolId = null;
  }

  addModuleStyles() {
    if (document.getElementById('playground-styles')) return;
    const style = document.createElement('style');
    style.id = 'playground-styles';
    style.textContent = `
      /* ── Typing Test ── */
      .typing-stats {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
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

      /* ── ASCII Art ── */
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

      /* ── Slider ── */
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
    `;
    document.head.appendChild(style);
  }

  destroy() {
    events.off('route:change', this._routeHandler);
    this.toolInstances.forEach(({ view, tool }) => { tool.destroy?.(); view.destroy(); });
    this.toolInstances.clear();
    this.workspace.innerHTML = '';
  }
}
