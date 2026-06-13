/* ═══════════════════════════════════════════════════════
   HASH ROUTER
   Client-side routing via location.hash
   ═══════════════════════════════════════════════════════ */

import { events } from './events.js';

export const ROUTES = {
  CHANGE: 'route:change',
};

class Router {
  constructor() {
    this.current = { module: null, tool: null };
    this.history = [];
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.parse());
    window.addEventListener('popstate', () => this.parse());
    // Parse initial hash on load
    requestAnimationFrame(() => this.parse());
  }

  parse() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);

    const prev = { ...this.current };

    this.current = {
      module: parts[0] || null,
      tool: parts[1] || null,
    };

    // Only emit if changed
    if (prev.module !== this.current.module || prev.tool !== this.current.tool) {
      events.emit(ROUTES.CHANGE, { current: { ...this.current }, prev });
    }
  }

  navigate(module, tool = null) {
    let path = `#/${module}`;
    if (tool) path += `/${tool}`;
    window.location.hash = path;
  }

  back() {
    window.history.back();
  }

  getRoute() {
    return { ...this.current };
  }
}

export const router = new Router();
