import { router } from '../core/router.js';

export class ToolView {
  constructor(container, options = {}) {
    this.container = container;
    this.toolId = options.toolId;
    this.toolName = options.toolName || '';
    this.toolIcon = options.toolIcon || '';
    this.moduleId = options.moduleId;
    this.tools = options.tools || [];
    this.currentIndex = options.currentIndex || 0;
    this.element = null;
    this.contentEl = null;
    this.sideNav = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'tool-view';
    this.element.style.display = 'none';

    this.element.innerHTML = `
      <header class="tool-view__header">
        <button class="tool-view__back" id="tool-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back</span>
        </button>
        <div class="tool-view__title">
          <span class="tool-view__icon">${this.toolIcon}</span>
          <h2>${this.toolName}</h2>
        </div>
        <div class="tool-view__actions">
          <kbd class="tool-view__kbd">ESC</kbd>
        </div>
      </header>
      <main class="tool-view__content"></main>
    `;

    this.container.appendChild(this.element);
    this.contentEl = this.element.querySelector('.tool-view__content');

    // Back button
    this.element.querySelector('#tool-back').addEventListener('click', () => {
      router.navigate(this.moduleId);
    });

    // Side navigation
    this.createSideNav();

    // ESC to go back
    this._escHandler = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        router.navigate(this.moduleId);
      }
    };
    document.addEventListener('keydown', this._escHandler);

    return this.contentEl;
  }

  createSideNav() {
    const prevTool = this.tools[this.currentIndex - 1];
    const nextTool = this.tools[this.currentIndex + 1];

    this.sideNav = document.createElement('div');
    this.sideNav.className = 'side-nav';
    this.sideNav.innerHTML = `
      <button class="side-nav__btn side-nav__btn--prev ${!prevTool ? 'side-nav__btn--disabled' : ''}" 
              ${!prevTool ? 'disabled' : ''} 
              title="${prevTool?.name || 'No previous tool'}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        ${prevTool ? `<span class="side-nav__tooltip">${prevTool.name}</span>` : ''}
      </button>
      <button class="side-nav__btn side-nav__btn--next ${!nextTool ? 'side-nav__btn--disabled' : ''}" 
              ${!nextTool ? 'disabled' : ''} 
              title="${nextTool?.name || 'No next tool'}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        ${nextTool ? `<span class="side-nav__tooltip">${nextTool.name}</span>` : ''}
      </button>
    `;

    this.element.appendChild(this.sideNav);

    // Bind clicks
    if (prevTool) {
      this.sideNav.querySelector('.side-nav__btn--prev').addEventListener('click', () => {
        router.navigate(this.moduleId, prevTool.id);
      });
    }
    if (nextTool) {
      this.sideNav.querySelector('.side-nav__btn--next').addEventListener('click', () => {
        router.navigate(this.moduleId, nextTool.id);
      });
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = '';
      this.element.style.opacity = '1';
      this.element.style.transform = 'none';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._escHandler);
    this.sideNav?.remove();
    this.element?.remove();
    this.element = null;
    this.contentEl = null;
    this.sideNav = null;
  }
}
