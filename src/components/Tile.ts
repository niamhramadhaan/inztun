import type { TileOptions, TileSpan } from '../types/index';

export class Tile {
  private options: Required<TileOptions>;
  private element: HTMLDivElement | null = null;

  constructor(options: TileOptions = {}) {
    this.options = {
      title: '',
      icon: '',
      badge: '',
      content: '',
      footer: '',
      span: { col: 4, row: 1 },
      featured: false,
      compact: false,
      ...options,
    };
  }

  render(): HTMLDivElement {
    const { title, icon, badge, content, footer, span, featured, compact } = this.options;

    const tile = document.createElement('div');
    tile.className = `tile col-${span.col} row-${span.row} fade-in ${featured ? 'tile--featured' : ''} ${compact ? 'tile--compact' : ''}`;

    let headerHtml = '';
    if (title) {
      headerHtml = `
        <div class="tile__header">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            ${icon ? `<span class="tile__icon">${icon}</span>` : ''}
            <h3 class="tile__title">${title}</h3>
          </div>
          ${badge ? `<span class="tile__badge">${badge}</span>` : ''}
        </div>
      `;
    }

    tile.innerHTML = `
      ${headerHtml}
      <div class="tile__content">
        ${content}
      </div>
      ${footer ? `<div class="tile__footer">${footer}</div>` : ''}
    `;

    this.element = tile;
    return tile;
  }

  setContent(html: string): void {
    const content = this.element?.querySelector('.tile__content') as HTMLElement;
    if (content) {
      content.innerHTML = html;
    }
  }

  setFooter(html: string): void {
    let footer = this.element?.querySelector('.tile__footer') as HTMLElement | null;
    if (!footer && this.element) {
      footer = document.createElement('div');
      footer.className = 'tile__footer';
      this.element.appendChild(footer);
    }
    if (footer) {
      footer.innerHTML = html;
    }
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
