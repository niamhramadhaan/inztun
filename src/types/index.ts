export interface Route {
  module: string | null;
  tool: string | null;
}

export interface Accent {
  hex: string;
  rgb: string;
}

export interface TileSpan {
  col: number;
  row: number;
}

export interface TileOptions {
  title?: string;
  icon?: string;
  badge?: string;
  content?: string;
  footer?: string;
  span?: TileSpan;
  featured?: boolean;
  compact?: boolean;
}

export interface Tool {
  name: string;
  icon: string;
  badge?: string;
  render(): string;
  init?(root: HTMLElement): void;
  destroy?(): void;
}

export interface ToolClass {
  new (): Tool;
}

export interface ToolRegistryEntry {
  id: string;
  Tool: ToolClass;
  span: TileSpan;
  featured?: boolean;
  category?: string;
  categoryName?: string;
}

export interface ToolInfo {
  useCases: string[];
  tips: string[];
  related: string[];
}

export type EventCallback = (data?: any) => void;

export interface PaletteEvent {
  OPEN_SETTINGS: string;
}

export interface ToolViewOptions {
  toolId: string;
  toolName: string;
  toolIcon: string;
  moduleId: string;
  tools: Array<{ id: string; name: string }>;
  currentIndex: number;
}

export type SortMode = 'alpha' | 'favorites';

export type ToastType = 'success' | 'error' | 'info';
