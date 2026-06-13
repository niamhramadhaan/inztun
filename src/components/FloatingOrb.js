/* ═══════════════════════════════════════════════════════
   FLOATING ORB
   Singularity Button — Ambient navigation beacon
   ═══════════════════════════════════════════════════════ */

import { events, EVENTS } from '../core/events.js';

export class FloatingOrb {
  constructor(commandPalette) {
    this.commandPalette = commandPalette;
    this.element = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.position = { x: null, y: null };
    this.addStyles();
    this.render();
    this.bindEvents();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Floating Orb ── */
      .orb {
        position: fixed;
        bottom: var(--space-6);
        right: var(--space-6);
        z-index: 200;
        width: 48px;
        height: 48px;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }

      .orb__core {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 40%, var(--accent), #8a6d3a);
        box-shadow: 
          0 0 20px rgba(201, 169, 110, 0.3),
          0 0 40px rgba(201, 169, 110, 0.1),
          inset 0 0 10px rgba(255, 255, 255, 0.2);
        transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
      }

      .orb__ring {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px solid rgba(201, 169, 110, 0.2);
        animation: orbPulse 3s ease-in-out infinite;
      }

      .orb__ring--outer {
        inset: -8px;
        border-color: rgba(201, 169, 110, 0.1);
        animation-delay: 1s;
      }

      .orb__icon {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--bg-void);
        pointer-events: none;
      }

      .orb__icon svg {
        width: 20px;
        height: 20px;
      }

      .orb__tooltip {
        position: absolute;
        bottom: calc(100% + 12px);
        right: 0;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        color: var(--text-secondary);
        white-space: nowrap;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 150ms ease, transform 150ms ease;
        pointer-events: none;
      }

      .orb__tooltip kbd {
        display: inline-block;
        padding: 1px 4px;
        margin-left: 4px;
        font-size: 10px;
        font-family: var(--font-mono);
        color: var(--text-muted);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: 3px;
      }

      .orb:hover .orb__core {
        transform: scale(1.08);
        box-shadow: 
          0 0 30px rgba(201, 169, 110, 0.4),
          0 0 60px rgba(201, 169, 110, 0.15),
          inset 0 0 10px rgba(255, 255, 255, 0.3);
      }

      .orb:hover .orb__tooltip {
        opacity: 1;
        transform: translateY(0);
      }

      .orb:active .orb__core {
        transform: scale(0.95);
      }

      .orb--dragging {
        cursor: grabbing;
      }

      .orb--dragging .orb__core {
        transform: scale(1.15);
        box-shadow: 
          0 0 40px rgba(201, 169, 110, 0.5),
          0 0 80px rgba(201, 169, 110, 0.2),
          inset 0 0 15px rgba(255, 255, 255, 0.3);
      }

      @keyframes orbPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.15);
          opacity: 0.5;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .orb {
          bottom: var(--space-4);
          right: var(--space-4);
          width: 44px;
          height: 44px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'orb';
    this.element.innerHTML = `
      <div class="orb__ring"></div>
      <div class="orb__ring orb__ring--outer"></div>
      <div class="orb__core"></div>
      <div class="orb__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <div class="orb__tooltip">
        Search <kbd>⌘K</kbd>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  bindEvents() {
    let dragStartTime = 0;
    let hasMoved = false;

    // Click to open palette
    this.element.addEventListener('click', (e) => {
      if (!hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        this.commandPalette.open();
      }
    });

    // Drag to reposition
    this.element.addEventListener('mousedown', (e) => {
      dragStartTime = Date.now();
      hasMoved = false;
      
      const rect = this.element.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const onMouseMove = (e) => {
        const dx = e.clientX - (rect.left + this.dragOffset.x);
        const dy = e.clientY - (rect.top + this.dragOffset.y);
        
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
          this.isDragging = true;
          this.element.classList.add('orb--dragging');
        }

        if (this.isDragging) {
          const x = e.clientX - this.dragOffset.x;
          const y = e.clientY - this.dragOffset.y;
          
          // Constrain to viewport
          const maxX = window.innerWidth - 48;
          const maxY = window.innerHeight - 48;
          
          this.element.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
          this.element.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
          this.element.style.right = 'auto';
          this.element.style.bottom = 'auto';
        }
      };

      const onMouseUp = () => {
        this.isDragging = false;
        this.element.classList.remove('orb--dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Snap to nearest edge
        if (hasMoved) {
          this.snapToEdge();
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // Keyboard shortcut
    events.on('keyboard:cmd+k', () => {
      this.commandPalette.toggle();
    });
  }

  snapToEdge() {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + 24;
    const viewportWidth = window.innerWidth;

    // Snap to left or right edge
    if (centerX < viewportWidth / 2) {
      this.element.style.left = 'var(--space-6)';
      this.element.style.right = 'auto';
    } else {
      this.element.style.left = 'auto';
      this.element.style.right = 'var(--space-6)';
    }
  }

  destroy() {
    this.element?.remove();
  }
}
