import type { SortMode } from '../types/index';

export interface ModuleToolbarOptions {
  moduleId: string;
  showHome?: boolean;
  initialSort?: SortMode;
  onHome?: () => void;
  onSearch: (query: string) => void;
  onSortChange: (mode: SortMode) => void;
}

export class ModuleToolbar {
  private options: ModuleToolbarOptions;
  private element: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private sortMode: SortMode;

  constructor(options: ModuleToolbarOptions) {
    this.options = { showHome: true, initialSort: 'alpha', ...options };
    this.sortMode = this.options.initialSort!;
  }

  render(): HTMLDivElement {
    this.element = document.createElement('div');
    this.element.className = 'module-toolbar fade-in';

    const showHome = this.options.showHome !== false;

    let html = '';

    if (showHome) {
      html += `
        <button class="btn btn--sm btn--icon module-home-btn" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      `;
    }

    html += `
      <div class="search-bar">
        <svg class="search-bar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="search-bar__input" type="text" placeholder="Search tools... ( / )" id="${this.options.moduleId}-tool-search">
        <kbd class="search-bar__kbd">/</kbd>
      </div>
      <div class="sort-group">
        <button class="sort-btn ${this.sortMode === 'alpha' ? 'sort-btn--active' : ''}" data-sort="alpha">A-Z</button>
        <button class="sort-btn ${this.sortMode === 'favorites' ? 'sort-btn--active' : ''}" data-sort="favorites">★ Favorites</button>
      </div>
    `;

    this.element.innerHTML = html;
    this.bindEvents();

    return this.element;
  }

  private bindEvents(): void {
    if (!this.element) return;

    this.element.querySelector('.module-home-btn')?.addEventListener('click', () => {
      this.options.onHome?.();
    });

    this.searchInput = this.element.querySelector(`#${this.options.moduleId}-tool-search`) as HTMLInputElement;

    this.searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this.options.onSearch(query);
    });

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.defaultPrevented && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.searchInput?.focus();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.element.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sortMode = (btn as HTMLElement).dataset.sort as SortMode;
        this.element!.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('sort-btn--active'));
        btn.classList.add('sort-btn--active');
        this.options.onSortChange(this.sortMode);
      });
    });
  }

  destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.element = null;
    this.searchInput = null;
  }
}
