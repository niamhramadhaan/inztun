/* ═══════════════════════════════════════════════════════
   DOCK COMPONENT
   Floating navigation bar
   ═══════════════════════════════════════════════════════ */

import { events, EVENTS } from '../core/events.js';

const MODULES = [
  {
    id: 'workers-suite',
    label: "Worker's Suite",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>`,
  },
  {
    id: 'freelance-core',
    label: 'Freelance Core',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`,
    disabled: true,
  },
  {
    id: 'marketing-lab',
    label: 'Marketing Lab',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
    disabled: true,
  },
  {
    id: 'design-studio',
    label: 'Design Studio',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="13.5" cy="6.5" r="2.5"/>
      <circle cx="19" cy="13.5" r="2.5"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="6" cy="18" r="2.5"/>
      <path d="M13.5 9v2.5M16.5 13.5h-2M6.5 9v5.5M9 18H6"/>
    </svg>`,
    disabled: true,
  },
];

export class Dock {
  constructor(container) {
    this.container = container;
    this.activeModule = null;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="dock">
        <div class="dock__inner">
          ${MODULES.map(mod => `
            <button 
              class="dock__item ${mod.disabled ? 'dock__item--disabled' : ''}" 
              data-module="${mod.id}"
              data-tooltip="${mod.label}"
              ${mod.disabled ? 'disabled' : ''}
            >
              <span class="dock__icon">${mod.icon}</span>
              <span class="dock__label">${mod.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="dock__indicator"></div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dock {
        position: fixed;
        bottom: var(--space-6);
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--z-dock);
      }

      .dock__inner {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: rgba(10, 10, 15, 0.8);
        backdrop-filter: blur(20px) saturate(1.5);
        -webkit-backdrop-filter: blur(20px) saturate(1.5);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-2xl);
        box-shadow: var(--shadow-lg);
      }

      .dock__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-3);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-out);
        color: var(--text-muted);
        position: relative;
      }

      .dock__item:hover:not(:disabled) {
        background: var(--bg-glass-hover);
        border-color: var(--border-hairline);
        color: var(--text-primary);
        transform: translateY(-2px);
      }

      .dock__item:active:not(:disabled) {
        transform: translateY(0) scale(0.95);
      }

      .dock__item--active {
        background: var(--accent-gold-dim) !important;
        border-color: var(--border-accent) !important;
        color: var(--accent-gold) !important;
      }

      .dock__item--disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .dock__icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dock__icon svg {
        width: 100%;
        height: 100%;
      }

      .dock__label {
        font-size: var(--text-xs);
        font-weight: 500;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .dock {
          bottom: var(--space-3);
          left: var(--space-3);
          right: var(--space-3);
          transform: none;
        }

        .dock__inner {
          justify-content: space-around;
        }

        .dock__label {
          display: none;
        }

        .dock__item {
          padding: var(--space-3);
        }
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    const items = this.container.querySelectorAll('.dock__item:not(:disabled)');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const moduleId = item.dataset.module;
        this.setActive(moduleId);
        events.emit(EVENTS.MODULE_CHANGE, moduleId);
      });
    });
  }

  setActive(moduleId) {
    this.container.querySelectorAll('.dock__item').forEach(item => {
      item.classList.toggle('dock__item--active', item.dataset.module === moduleId);
    });
    this.activeModule = moduleId;
  }
}
