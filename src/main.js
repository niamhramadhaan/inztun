import './styles/variables.css';
import './styles/base.css';
import './styles/grid.css';
import './styles/components.css';

import { Cosmos } from './core/cosmos.js';
import { events, EVENTS } from './core/events.js';
import { router, ROUTES } from './core/router.js';
import { db } from './core/db.js';
import { CommandPalette, PALETTE_EVENTS } from './components/CommandPalette.js';
import { FloatingOrb } from './components/FloatingOrb.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { WorkerSuite } from './modules/workers-suite/index.js';
import { Playground } from './modules/playground/index.js';

class Inztun {
  constructor() {
    this.cosmos = null;
    this.commandPalette = null;
    this.floatingOrb = null;
    this.settingsPanel = null;
    this.activeModule = null;
    this.modules = new Map();
    this.workspace = document.getElementById('workspace');
    this.init();
  }

  async init() {
    const canvas = document.getElementById('cosmos');
    this.cosmos = new Cosmos(canvas);
    this.cosmos.start();

    // Load saved accent before rendering
    await this.loadAccent();

    this.commandPalette = new CommandPalette();
    this.floatingOrb = new FloatingOrb(this.commandPalette);
    this.settingsPanel = new SettingsPanel();

    this.registerModule('workers-suite', WorkerSuite);
    this.registerModule('playground', Playground);
    this.bindEvents();

    const route = router.getRoute();
    if (route.module) {
      this.loadModule(route.module);
    } else {
      const lastModule = await db.getPreference('activeModule', 'workers-suite');
      router.navigate(lastModule);
    }

    document.body.classList.add('loaded');
    console.log('%c✦ inztun initialized', 'color: #c9a96e; font-weight: bold;');
  }

  async loadAccent() {
    const accent = await db.getPreference('accent', null);
    if (accent && accent.hex && accent.rgb) {
      const root = document.documentElement;
      root.style.setProperty('--accent', accent.hex);
      root.style.setProperty('--accent-dim', `rgba(${accent.rgb}, 0.15)`);
      root.style.setProperty('--accent-glow', `rgba(${accent.rgb}, 0.08)`);
      root.style.setProperty('--accent-border', `rgba(${accent.rgb}, 0.3)`);
    }
  }

  registerModule(id, ModuleClass) {
    this.modules.set(id, ModuleClass);
  }

  bindEvents() {
    events.on(ROUTES.CHANGE, ({ current, prev }) => {
      if (current.module !== prev.module) this.loadModule(current.module);
    });

    events.on(EVENTS.MODULE_CHANGE, (moduleId) => router.navigate(moduleId));
    events.on(EVENTS.TOOL_SELECT, ({ moduleId, toolId }) => router.navigate(moduleId, toolId));
    events.on(EVENTS.NOTIFICATION, ({ message, type }) => this.showNotification(message, type));

    // Settings panel
    events.on(PALETTE_EVENTS.OPEN_SETTINGS, () => this.settingsPanel.open());
  }

  loadModule(moduleId) {
    const ModuleClass = this.modules.get(moduleId);
    if (!ModuleClass) return;

    if (this.activeModule) this.activeModule.destroy?.();
    this.workspace.innerHTML = '';

    this.activeModule = new ModuleClass(this.workspace);
    this.activeModule.render?.();

    db.setPreference('activeModule', moduleId);
    console.log(`%c→ ${moduleId}`, 'color: #8a8a9a;');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: var(--space-6);
      right: var(--space-6);
      padding: var(--space-3) var(--space-4);
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: var(--text-sm);
      z-index: var(--z-overlay);
      animation: slideIn var(--duration-normal) var(--ease-out);
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = `slideOut var(--duration-normal) var(--ease-out) forwards`;
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

const app = new Inztun();

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(20px); }
  }
`;
document.head.appendChild(style);
