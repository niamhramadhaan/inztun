import { Tile } from './Tile';
import { Toast } from './Toast';
import type { Tool, ToolRegistryEntry, ToolInfo, TileSpan } from '../types/index';

export interface Category {
  id: string;
  name: string;
  tooltip: string;
  tools: ToolRegistryEntry[];
}

export interface CreateToolCardParams {
  toolId: string;
  tool: Tool;
  span: TileSpan;
  featured?: boolean;
  index: number;
  moduleId: string;
  isFavorite: boolean;
  description: string;
  onToggleFavorite: (toolId: string) => void;
  onNavigate: (moduleId: string, toolId: string) => void;
}

export function createToolCard(params: CreateToolCardParams): HTMLElement {
  const { toolId, tool, span, featured, index, isFavorite, description, onToggleFavorite, onNavigate } = params;

  const card = new Tile({
    title: tool.name,
    icon: tool.icon,
    badge: tool.badge || '',
    content: `
      <p class="tile__desc">${description}</p>
      <div class="tile__spacer"></div>
      <div class="tile__footer-row">
        <button class="tile__fav-btn ${isFavorite ? 'tile__fav-btn--active' : ''}" data-tool="${toolId}" title="Toggle favorite">
          ${isFavorite ? '★' : '☆'}
        </button>
        <span class="tile__open-label">Open →</span>
      </div>
    `,
    span,
    featured,
  });

  const element = card.render();
  element.classList.add('tile--clickable');
  element.style.animationDelay = `${index * 60}ms`;

  element.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.tile__fav-btn')) return;
    onNavigate(params.moduleId, toolId);
  });

  const favBtn = element.querySelector('.tile__fav-btn');
  favBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggleFavorite(toolId);
    favBtn.classList.toggle('tile__fav-btn--active');
    favBtn.textContent = favBtn.classList.contains('tile__fav-btn--active') ? '★' : '☆';
    Toast.info(favBtn.classList.contains('tile__fav-btn--active') ? 'Added to favorites' : 'Removed from favorites');
  });

  return element;
}

export interface CreateTipsPanelParams {
  toolId: string;
  data: ToolInfo;
  moduleId: string;
  allTools: ToolRegistryEntry[];
  onNavigate: (moduleId: string, toolId: string) => void;
}

export function createTipsPanel(params: CreateTipsPanelParams): HTMLElement {
  const { data, moduleId, allTools, onNavigate } = params;

  const panel = document.createElement('div');
  panel.className = 'tips-panel';

  const relatedTools = allTools
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

  const toggle = panel.querySelector('.tips-toggle')!;
  const content = panel.querySelector('.tips-content') as HTMLElement;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    content.style.display = expanded ? 'none' : 'block';
    panel.classList.toggle('tips-panel--expanded', !expanded);
  });

  panel.querySelectorAll('.tips-related__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate(moduleId, (link as HTMLElement).dataset.tool!);
    });
  });

  return panel;
}

export interface CreateCategorySectionParams {
  category: Category;
  collapsed: boolean;
  onToggleCollapse: (catId: string, expanded: boolean) => void;
  createCard: (entry: ToolRegistryEntry, index: number) => HTMLElement;
}

export function createCategorySection(params: CreateCategorySectionParams): HTMLElement {
  const { category, collapsed, onToggleCollapse, createCard } = params;

  const section = document.createElement('div');
  section.className = 'category-section fade-in';
  section.dataset.category = category.id;

  section.innerHTML = `
    <button class="category-header" aria-expanded="${!collapsed}" title="${category.tooltip || ''}">
      <span class="category-header__name">${category.name}</span>
      <span class="category-header__count">${category.tools.length}</span>
      <svg class="category-header__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    <div class="category-grid" style="${collapsed ? 'display: none' : ''}"></div>
  `;

  const header = section.querySelector('.category-header')!;
  const grid = section.querySelector('.category-grid') as HTMLDivElement;

  header.addEventListener('click', () => {
    const expanded = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', String(!expanded));
    grid.style.display = expanded ? 'none' : '';
    onToggleCollapse(category.id, !expanded);
  });

  category.tools.forEach((entry, index) => {
    grid.appendChild(createCard(entry, index));
  });

  return section;
}
