import type { Route } from '../types/index';
import { events } from './events';

export const ROUTES = {
  CHANGE: 'route:change',
} as const;

class Router {
  current: Route;
  history: Route[];

  constructor() {
    this.current = { module: null, tool: null };
    this.history = [];
    this.init();
  }

  private init(): void {
    window.addEventListener('hashchange', () => this.parse());
    window.addEventListener('popstate', () => this.parse());
    requestAnimationFrame(() => this.parse());
  }

  private parse(): void {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);

    const prev = { ...this.current };

    this.current = {
      module: parts[0] || null,
      tool: parts[1] || null,
    };

    if (prev.module !== this.current.module || prev.tool !== this.current.tool) {
      events.emit(ROUTES.CHANGE, { current: { ...this.current }, prev });
    }
  }

  navigate(module: string, tool: string | null = null): void {
    let path = `#/${module}`;
    if (tool) path += `/${tool}`;
    window.location.hash = path;
  }

  back(): void {
    window.history.back();
  }

  getRoute(): Route {
    return { ...this.current };
  }
}

export const router = new Router();
