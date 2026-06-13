/* ═══════════════════════════════════════════════════════
   COMMAND PALETTE
   Cosmic Command — Fuzzy search navigation
   ═══════════════════════════════════════════════════════ */

import { router } from '../core/router.js';
import { events } from '../core/events.js';

export const PALETTE_EVENTS = {
  OPEN_SETTINGS: 'palette:open-settings',
};

const COMMANDS = [
  // Navigation
  { id: 'nav:workers-suite', label: "Worker's Suite", category: 'Modules', icon: '⚡', action: () => router.navigate('workers-suite') },
  { id: 'nav:playground', label: "Playground", category: 'Modules', icon: '🎮', action: () => router.navigate('playground') },
  { id: 'nav:freelance-core', label: 'Freelance Core', category: 'Modules', icon: '💼', action: null, disabled: true },
  { id: 'nav:marketing-lab', label: 'Marketing Lab', category: 'Modules', icon: '📊', action: null, disabled: true },
  { id: 'nav:design-studio', label: 'Design Studio', category: 'Modules', icon: '🎨', action: null, disabled: true },

  // Worker's Suite Tools
  { id: 'tool:json-formatter', label: 'JSON Formatter', category: "Worker's Suite", icon: '{ }', action: () => router.navigate('workers-suite', 'json-formatter') },
  { id: 'tool:base64', label: 'Base64 Encoder/Decoder', category: "Worker's Suite", icon: '01', action: () => router.navigate('workers-suite', 'base64') },
  { id: 'tool:color-converter', label: 'Color Converter', category: "Worker's Suite", icon: '◎', action: () => router.navigate('workers-suite', 'color-converter') },
  { id: 'tool:regex-tester', label: 'Regex Tester', category: "Worker's Suite", icon: '.*', action: () => router.navigate('workers-suite', 'regex-tester') },
  { id: 'tool:hash-generator', label: 'Hash Generator', category: "Worker's Suite", icon: '#', action: () => router.navigate('workers-suite', 'hash-generator') },
  { id: 'tool:uuid-generator', label: 'UUID Generator', category: "Worker's Suite", icon: '⊕', action: () => router.navigate('workers-suite', 'uuid-generator') },
  { id: 'tool:timestamp', label: 'Timestamp Converter', category: "Worker's Suite", icon: '⏱', action: () => router.navigate('workers-suite', 'timestamp') },
  { id: 'tool:lorem-ipsum', label: 'Lorem Ipsum Generator', category: "Worker's Suite", icon: '¶', action: () => router.navigate('workers-suite', 'lorem-ipsum') },

  // Playground Tools
  { id: 'tool:typing-test', label: 'Typing Test', category: 'Playground', icon: '⌨', action: () => router.navigate('playground', 'typing-test') },
  { id: 'tool:ascii-art', label: 'ASCII Art Generator', category: 'Playground', icon: 'A', action: () => router.navigate('playground', 'ascii-art') },
  { id: 'tool:zalgo-text', label: 'Zalgo Text Generator', category: 'Playground', icon: 'Z', action: () => router.navigate('playground', 'zalgo-text') },
  { id: 'tool:flip-text', label: 'Flip Text', category: 'Playground', icon: '↕', action: () => router.navigate('playground', 'flip-text') },
  { id: 'tool:leet-speak', label: 'Leet Speak Converter', category: 'Playground', icon: '1', action: () => router.navigate('playground', 'leet-speak') },
  { id: 'tool:morse-code', label: 'Morse Code', category: 'Playground', icon: '•', action: () => router.navigate('playground', 'morse-code') },

  // Settings
  { id: 'settings:accent', label: 'Change Accent Color', category: 'Settings', icon: '◉', action: () => events.emit(PALETTE_EVENTS.OPEN_SETTINGS) },
];

export class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [...COMMANDS];
    this.overlay = null;
    this.input = null;
    this.resultsList = null;
    this.addStyles();
    this.bindKeyboard();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Command Palette ── */
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
        max-height: 420px;
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
        max-height: 320px;
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
        font-size: var(--text-sm);
        color: var(--accent);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        flex-shrink: 0;
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

      .cmd-item__category {
        font-size: var(--text-xs);
        color: var(--text-ghost);
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
    `;
    document.head.appendChild(style);
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }

      // Arrow navigation when open
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

  render() {
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

    // Click overlay to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Input handler
    this.input.addEventListener('input', () => this.filter());
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (!this.overlay) this.render();
    this.isOpen = true;
    this.overlay.classList.add('cmd-overlay--open');
    this.input.value = '';
    this.filter();
    
    requestAnimationFrame(() => {
      this.input.focus();
    });
  }

  close() {
    this.isOpen = false;
    this.overlay?.classList.remove('cmd-overlay--open');
    this.input?.blur();
  }

  filter() {
    const query = this.input.value.toLowerCase().trim();
    
    if (!query) {
      this.filteredCommands = [...COMMANDS];
    } else {
      this.filteredCommands = COMMANDS.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.category}`.toLowerCase();
        return this.fuzzyMatch(query, searchText);
      });
    }

    this.selectedIndex = 0;
    this.renderResults(query);
  }

  fuzzyMatch(query, text) {
    let qi = 0;
    for (let i = 0; i < text.length && qi < query.length; i++) {
      if (text[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  highlightMatch(text, query) {
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

  renderResults(query) {
    if (this.filteredCommands.length === 0) {
      this.resultsList.innerHTML = `<div class="cmd-empty">No results for "${query}"</div>`;
      return;
    }

    // Group by category
    const grouped = {};
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
        html += `
          <div class="cmd-item ${isSelected ? 'cmd-item--selected' : ''} ${isDisabled ? 'cmd-item--disabled' : ''}" 
               data-index="${globalIndex}" 
               data-id="${cmd.id}">
            <span class="cmd-item__icon">${cmd.icon}</span>
            <span class="cmd-item__label">${this.highlightMatch(cmd.label, query)}</span>
            ${isDisabled ? '<span class="cmd-item__kbd">Soon</span>' : ''}
          </div>
        `;
        globalIndex++;
      }
    }

    this.resultsList.innerHTML = html;

    // Bind click handlers
    this.resultsList.querySelectorAll('.cmd-item:not(.cmd-item--disabled)').forEach(item => {
      item.addEventListener('click', () => {
        const cmdId = item.dataset.id;
        const cmd = this.filteredCommands.find(c => c.id === cmdId);
        if (cmd?.action) {
          this.close();
          cmd.action();
        }
      });

      item.addEventListener('mouseenter', () => {
        const index = parseInt(item.dataset.index);
        this.selectedIndex = index;
        this.updateSelection();
      });
    });
  }

  moveSelection(delta) {
    const enabledItems = this.filteredCommands.filter(cmd => !cmd.disabled);
    const maxIndex = this.filteredCommands.length - 1;
    
    // Move to next/prev enabled item
    let newIndex = this.selectedIndex + delta;
    while (newIndex >= 0 && newIndex <= maxIndex && this.filteredCommands[newIndex]?.disabled) {
      newIndex += delta;
    }
    
    if (newIndex >= 0 && newIndex <= maxIndex) {
      this.selectedIndex = newIndex;
    }
    
    this.updateSelection();
    this.scrollToSelected();
  }

  updateSelection() {
    this.resultsList.querySelectorAll('.cmd-item').forEach((item) => {
      const index = parseInt(item.dataset.index);
      item.classList.toggle('cmd-item--selected', index === this.selectedIndex);
    });
  }

  scrollToSelected() {
    const selected = this.resultsList.querySelector('.cmd-item--selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  executeSelected() {
    const cmd = this.filteredCommands[this.selectedIndex];
    
    if (cmd && !cmd.disabled && cmd.action) {
      this.close();
      cmd.action();
    }
  }

  destroy() {
    this.overlay?.remove();
    this.overlay = null;
  }
}
