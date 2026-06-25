import { router } from '../core/router';
import type { ToolViewOptions } from '../types/index';

export class ToolView {
  private container: HTMLElement;
  private toolId: string;
  private toolName: string;
  private toolIcon: string;
  private toolDescription: string;
  private moduleId: string;
  private tools: Array<{ id: string; name: string }>;
  private currentIndex: number;
  private element: HTMLDivElement | null = null;
  contentEl: HTMLElement | null = null;
  private sideNav: HTMLDivElement | null = null;
  private _altKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement, options: ToolViewOptions) {
    this.container = container;
    this.toolId = options.toolId;
    this.toolName = options.toolName || '';
    this.toolIcon = options.toolIcon || '';
    this.toolDescription = options.toolDescription || '';
    this.moduleId = options.moduleId;
    this.tools = options.tools || [];
    this.currentIndex = options.currentIndex || 0;
  }

  render(): HTMLElement {
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
          <div class="tool-view__title-text">
            <h2>${this.toolName}</h2>
            ${this.toolDescription ? `<p class="tool-view__desc">${this.toolDescription}</p>` : ''}
          </div>
        </div>
        <div class="tool-view__actions">
          <kbd class="tool-view__kbd">ESC</kbd>
        </div>
      </header>
      <main class="tool-view__content"></main>
    `;

    this.container.appendChild(this.element);
    this.contentEl = this.element.querySelector('.tool-view__content');

    this.element.querySelector('#tool-back')?.addEventListener('click', () => {
      router.navigate('home');
    });

    this.createSideNav();

    document.addEventListener('keydown', this._escHandler);
    this._altKeyHandler = (e: KeyboardEvent): void => {
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigatePrev();
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateNext();
      }
    };
    document.addEventListener('keydown', this._altKeyHandler);

    return this.contentEl!;
  }

  private navigatePrev(): void {
    const prevTool = this.tools[this.currentIndex - 1];
    if (prevTool) router.navigate(this.moduleId, prevTool.id);
  }

  private navigateNext(): void {
    const nextTool = this.tools[this.currentIndex + 1];
    if (nextTool) router.navigate(this.moduleId, nextTool.id);
  }

  private createSideNav(): void {
    const prevTool = this.tools[this.currentIndex - 1];
    const nextTool = this.tools[this.currentIndex + 1];

    this.sideNav = document.createElement('div');
    this.sideNav.className = 'side-nav';
    this.sideNav.innerHTML = `
      <button class="side-nav__btn side-nav__btn--prev ${!prevTool ? 'side-nav__btn--disabled' : ''}" 
              ${!prevTool ? 'disabled' : ''} 
              title="${prevTool?.name || 'No previous tool'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
        ${prevTool ? `<span class="side-nav__tooltip">${prevTool.name}</span>` : ''}
      </button>
      <button class="side-nav__btn side-nav__btn--next ${!nextTool ? 'side-nav__btn--disabled' : ''}" 
              ${!nextTool ? 'disabled' : ''} 
              title="${nextTool?.name || 'No next tool'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        ${nextTool ? `<span class="side-nav__tooltip">${nextTool.name}</span>` : ''}
      </button>
    `;

    this.element!.appendChild(this.sideNav);

    if (prevTool) {
      this.sideNav.querySelector('.side-nav__btn--prev')?.addEventListener('click', () => {
        router.navigate(this.moduleId, prevTool.id);
      });
    }
    if (nextTool) {
      this.sideNav.querySelector('.side-nav__btn--next')?.addEventListener('click', () => {
        router.navigate(this.moduleId, nextTool.id);
      });
    }
  }

  focusFirstInput(): void {
    if (!this.contentEl) return;
    const el = this.contentEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])',
    );
    if (el) {
      requestAnimationFrame(() => el.focus());
    }
  }

  private _escHandler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      router.navigate('home');
    }
  };

  show(): void {
    if (this.element) {
      this.element.style.display = '';
      this.element.style.opacity = '1';
      this.element.style.transform = 'none';
    }
    document.getElementById('topbar')?.style.setProperty('display', 'none');
  }

  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
    document.getElementById('topbar')?.style.removeProperty('display');
  }

  destroy(): void {
    document.removeEventListener('keydown', this._escHandler);
    if (this._altKeyHandler) document.removeEventListener('keydown', this._altKeyHandler);
    this.sideNav?.remove();
    this.element?.remove();
    this.element = null;
    this.contentEl = null;
    this.sideNav = null;
  }
}
