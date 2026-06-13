import './styles/variables.css';
import './styles/base.css';
import './styles/grid.css';
import './styles/components.css';

import { Cosmos } from './core/cosmos';
import { events, EVENTS } from './core/events';
import { router, ROUTES } from './core/router';
import { db } from './core/db';
import { CommandPalette, PALETTE_EVENTS } from './components/CommandPalette';
import { FloatingOrb } from './components/FloatingOrb';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkerSuite } from './modules/workers-suite/index';
import { Playground } from './modules/playground/index';
import type { Accent } from './types/index';

class Inztun {
  private cosmos: Cosmos | null = null;
  private commandPalette: CommandPalette | null = null;
  private floatingOrb: FloatingOrb | null = null;
  private settingsPanel: SettingsPanel | null = null;
  private activeModule: WorkerSuite | Playground | null = null;
  private modules = new Map<string, typeof WorkerSuite | typeof Playground>();
  private workspace: HTMLElement;

  constructor() {
    this.workspace = document.getElementById('workspace')!;
    this.init();
  }

  private async init(): Promise<void> {
    const canvas = document.getElementById('cosmos') as HTMLCanvasElement;
    this.cosmos = new Cosmos(canvas);
    this.cosmos.start();

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
      const lastModule = await db.getPreference('activeModule', 'workers-suite') as string;
      router.navigate(lastModule);
    }

    document.body.classList.add('loaded');
    console.log('%c✦ inztun initialized', 'color: #c9a96e; font-weight: bold;');
  }

  private async loadAccent(): Promise<void> {
    const accent = await db.getPreference('accent', null) as Accent | null;
    if (accent && accent.hex && accent.rgb) {
      const root = document.documentElement;
      root.style.setProperty('--accent', accent.hex);
      root.style.setProperty('--accent-dim', `rgba(${accent.rgb}, 0.15)`);
      root.style.setProperty('--accent-glow', `rgba(${accent.rgb}, 0.08)`);
      root.style.setProperty('--accent-border', `rgba(${accent.rgb}, 0.3)`);
    }
  }

  private registerModule(id: string, ModuleClass: typeof WorkerSuite | typeof Playground): void {
    this.modules.set(id, ModuleClass);
  }

  private bindEvents(): void {
    events.on(ROUTES.CHANGE, ({ current, prev }: { current: { module: string | null }; prev: { module: string | null } }) => {
      if (current.module !== prev.module && current.module) this.loadModule(current.module);
    });

    events.on(EVENTS.MODULE_CHANGE, (moduleId) => router.navigate(moduleId as string));
    events.on(EVENTS.TOOL_SELECT, ({ moduleId, toolId }: { moduleId: string; toolId: string }) => router.navigate(moduleId, toolId));
    events.on(EVENTS.NOTIFICATION, ({ message, type }: { message: string; type?: string }) => this.showNotification(message, type));

    events.on(PALETTE_EVENTS.OPEN_SETTINGS, () => this.settingsPanel?.open());
  }

  private loadModule(moduleId: string): void {
    const ModuleClass = this.modules.get(moduleId);
    if (!ModuleClass) return;

    if (this.activeModule) this.activeModule.destroy?.();
    this.workspace.innerHTML = '';

    this.activeModule = new (ModuleClass as typeof WorkerSuite | typeof Playground)(this.workspace);
    if ('render' in this.activeModule) {
      (this.activeModule as WorkerSuite).render();
    }

    db.setPreference('activeModule', moduleId);
    console.log(`%c→ ${moduleId}`, 'color: #8a8a9a;');
  }

  private showNotification(message: string, type = 'info'): void {
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
