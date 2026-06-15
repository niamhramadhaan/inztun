import type { CommandPalette } from './CommandPalette';
import { router } from '../core/router';
import { events } from '../core/events';
import { ICONS } from '../core/icons';

const MODULES = [
  { id: 'home', name: 'Home', icon: ICONS.home },
  { id: 'workers-suite', name: "Worker's Suite", icon: ICONS.workers },
  { id: 'design-studio', name: 'Design Studio', icon: ICONS.design },
  { id: 'marketing-lab', name: 'Marketing Lab', icon: ICONS.marketing },
  { id: 'freelance-core', name: 'Freelance Core', icon: ICONS.freelance },
  { id: 'playground', name: 'Playground', icon: ICONS.play },
];

export class BottomNav {
  private commandPalette: CommandPalette;
  private element: HTMLDivElement | null = null;
  private sheetEl: HTMLDivElement | null = null;
  private backdropEl: HTMLDivElement | null = null;
  private sheetOpen = false;

  constructor(commandPalette: CommandPalette) {
    this.commandPalette = commandPalette;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.element = document.createElement('div');
    this.element.className = 'bottom-nav';

    this.element.innerHTML = `
      <div class="bottom-nav__bar">
        <button class="bottom-nav__btn bottom-nav__btn--modules" title="Modules">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span class="bottom-nav__btn-label">Modules</span>
        </button>
        <button class="bottom-nav__btn bottom-nav__btn--home" title="Home">
          <div class="bottom-nav__home-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="bottom-nav__btn-label">Home</span>
        </button>
        <button class="bottom-nav__btn bottom-nav__btn--search" title="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="bottom-nav__btn-label">Search</span>
        </button>
      </div>
    `;

    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'bottom-nav__backdrop';

    this.sheetEl = document.createElement('div');
    this.sheetEl.className = 'bottom-nav__sheet';
    this.sheetEl.innerHTML = `
      <div class="bottom-nav__sheet-handle"></div>
      <div class="bottom-nav__sheet-title">Modules</div>
      <div class="bottom-nav__sheet-list">
        ${MODULES.map(m => `
          <button class="bottom-nav__sheet-item" data-module="${m.id}">
            ${m.icon}
            <span>${m.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(this.backdropEl);
    document.body.appendChild(this.sheetEl);
    document.body.appendChild(this.element);
  }

  private bindEvents(): void {
    if (!this.element) return;

    this.element.querySelector('.bottom-nav__btn--modules')?.addEventListener('click', () => {
      this.toggleSheet();
    });

    this.element.querySelector('.bottom-nav__btn--home')?.addEventListener('click', () => {
      this.closeSheet();
      router.navigate('home');
    });

    this.element.querySelector('.bottom-nav__btn--search')?.addEventListener('click', () => {
      this.closeSheet();
      this.commandPalette.open();
    });

    this.backdropEl?.addEventListener('click', () => {
      this.closeSheet();
    });

    this.sheetEl?.querySelectorAll('.bottom-nav__sheet-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleId = (btn as HTMLElement).dataset.module!;
        this.closeSheet();
        router.navigate(moduleId);
      });
    });

    this.highlightActiveModule();

    const routeHandler = ({ current }: { current: { module: string | null } }) => {
      if (current.module) this.highlightActiveModule();
    };
    events.on('route:change', routeHandler);
  }

  private highlightActiveModule(): void {
    if (!this.sheetEl) return;
    const route = router.getRoute();
    this.sheetEl.querySelectorAll('.bottom-nav__sheet-item').forEach(btn => {
      const isActive = (btn as HTMLElement).dataset.module === route.module;
      btn.classList.toggle('bottom-nav__sheet-item--active', isActive);
    });
  }

  private toggleSheet(): void {
    if (this.sheetOpen) this.closeSheet();
    else this.openSheet();
  }

  private openSheet(): void {
    this.sheetOpen = true;
    this.highlightActiveModule();
    this.backdropEl?.classList.add('bottom-nav__backdrop--open');
    this.sheetEl?.classList.add('bottom-nav__sheet--open');
  }

  private closeSheet(): void {
    this.sheetOpen = false;
    this.backdropEl?.classList.remove('bottom-nav__backdrop--open');
    this.sheetEl?.classList.remove('bottom-nav__sheet--open');
  }

  destroy(): void {
    this.element?.remove();
    this.sheetEl?.remove();
    this.backdropEl?.remove();
  }
}
