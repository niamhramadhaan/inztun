import type { EventCallback } from '../types/index';

class EventBus {
  private listeners: Map<string, Set<EventCallback>>;

  constructor() {
    this.listeners = new Map();
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)!) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event handler error for "${event}":`, error);
        }
      }
    }
  }

  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
}

export const events = new EventBus();

export const EVENTS = {
  MODULE_CHANGE: 'module:change',
  TOOL_SELECT: 'tool:select',
  THEME_CHANGE: 'theme:change',
  NOTIFICATION: 'notification',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
} as const;
