import { Tile } from '../../components/Tile';
import { ToolView } from '../../components/ToolView';
import { ActivityLog } from '../../components/ActivityLog';
import { getCurrencySymbol } from '../../components/SettingsPanel';
import { router, ROUTES } from '../../core/router';
import { events } from '../../core/events';
import { db } from '../../core/db';
import { ICONS } from '../../core/icons';
import type { Tool, ToolClass, ToolRegistryEntry, ToolViewOptions } from '../../types/index';

import { JsonFormatter } from '../workers-suite/tools/json-formatter';
import { Base64Tool } from '../workers-suite/tools/base64';
import { HashGenerator } from '../workers-suite/tools/hash-generator';
import { UuidGenerator } from '../workers-suite/tools/uuid-generator';
import { LoremIpsum } from '../workers-suite/tools/lorem-ipsum';
import { CharacterCounter } from '../workers-suite/tools/char-counter';
import { UrlEncoder } from '../workers-suite/tools/url-encoder';
import { MarkdownPreview } from '../workers-suite/tools/markdown-preview';
import { MarkdownToHtml } from '../workers-suite/tools/markdown-html';
import { PasswordGenerator } from '../workers-suite/tools/password-gen';
import { CssUnitConverter } from '../workers-suite/tools/css-unit';
import { Scratchpad } from '../workers-suite/tools/scratchpad';
import { TypingTest } from '../playground/tools/typing-test';
import { BannerGenerator } from '../playground/tools/ascii-art';
import { PixelArt } from '../playground/tools/pixel-art';
import { CssGradient } from '../design-studio/tools/css-gradient';
import { BorderRadius } from '../design-studio/tools/border-radius';
import { TypographyScale } from '../design-studio/tools/typography-scale';
import { SpacingSystem } from '../design-studio/tools/spacing-system';
import { ImageCompress } from '../design-studio/tools/image-compress';
import { ImageResize } from '../design-studio/tools/image-resize';
import { ImageConvert } from '../design-studio/tools/image-convert';
import { ContrastChecker } from '../design-studio/tools/contrast-checker';
import { FaviconGenerator } from '../design-studio/tools/favicon-generator';
import { LogoBuilder } from '../design-studio/tools/logo-builder';
import { ImageCrop } from '../design-studio/tools/image-crop';
import { ImageFilters } from '../design-studio/tools/image-filters';
import { ImageMetadata } from '../design-studio/tools/image-metadata';
import { FontPairer } from '../design-studio/tools/font-pairer';
import { BrandKit } from '../design-studio/tools/brand-kit';
import { UtmBuilder } from '../marketing-lab/tools/utm-builder';
import { SeoMeta } from '../marketing-lab/tools/seo-meta';
import { SocialCounter } from '../marketing-lab/tools/social-counter';
import { ColorPalette } from '../marketing-lab/tools/color-palette';
import { OgPreview } from '../marketing-lab/tools/og-preview';
import { SocialResizer } from '../marketing-lab/tools/social-resizer';
import { InvoiceGenerator } from '../freelance-core/tools/invoice-generator';
import { RateCalculator } from '../freelance-core/tools/rate-calculator';
import { TimeTracker } from '../freelance-core/tools/time-tracker';
import { ExpenseTracker } from '../freelance-core/tools/expense-tracker';
import { ContractTemplates } from '../freelance-core/tools/contract-templates';
import { ClientManager } from '../freelance-core/tools/client-manager';
import { TaxEstimator } from '../freelance-core/tools/tax-estimator';
import { TimezoneConverter } from '../freelance-core/tools/timezone-converter';
import { ProjectManager } from '../freelance-core/tools/project-manager';
import { PdfMerge } from '../workers-suite/tools/pdf-merge';
import { PdfSplit } from '../workers-suite/tools/pdf-split';
import { PdfCompress } from '../workers-suite/tools/pdf-compress';
import { PdfProtect } from '../workers-suite/tools/pdf-protect';
import { PdfSign } from '../workers-suite/tools/pdf-sign';
import { PdfToImages } from '../workers-suite/tools/pdf-to-images';
import { PdfMetadata } from '../workers-suite/tools/pdf-metadata';

const ALL_TOOLS: Record<string, { Tool: ToolClass; module: string; name: string; description: string }> = {
  'json-formatter': { Tool: JsonFormatter, module: 'workers-suite', name: 'JSON Formatter', description: 'Pretty-print, minify, and validate JSON data.' },
  'base64': { Tool: Base64Tool, module: 'workers-suite', name: 'Base64', description: 'Encode and decode Base64 strings.' },
  'hash-generator': { Tool: HashGenerator, module: 'workers-suite', name: 'Hash Generator', description: 'Generate SHA-256, SHA-1, and MD5 hashes.' },
  'uuid-generator': { Tool: UuidGenerator, module: 'workers-suite', name: 'UUID Generator', description: 'Generate v4 UUIDs in bulk.' },
  'lorem-ipsum': { Tool: LoremIpsum, module: 'workers-suite', name: 'Lorem Ipsum', description: 'Generate placeholder text for designs.' },
  'char-counter': { Tool: CharacterCounter, module: 'workers-suite', name: 'Char Counter', description: 'Count characters, words, lines, sentences, reading time.' },
  'url-encoder': { Tool: UrlEncoder, module: 'workers-suite', name: 'URL Encoder', description: 'Encode/decode URLs and parse URL structure.' },
  'markdown-preview': { Tool: MarkdownPreview, module: 'workers-suite', name: 'MD Preview', description: 'Live markdown preview with GFM support.' },
  'markdown-html': { Tool: MarkdownToHtml, module: 'workers-suite', name: 'MD→HTML', description: 'Convert markdown to clean HTML.' },
  'password-gen': { Tool: PasswordGenerator, module: 'workers-suite', name: 'Password Gen', description: 'Generate secure passwords with customizable options.' },
  'css-unit': { Tool: CssUnitConverter, module: 'workers-suite', name: 'CSS Unit', description: 'Convert between px, rem, em, vw, vh, and more.' },
  'scratchpad': { Tool: Scratchpad, module: 'workers-suite', name: 'Scratchpad', description: 'Markdown notes with auto-save, search, and client/project linking.' },
  'typing-test': { Tool: TypingTest, module: 'playground', name: 'Typing Test', description: 'Test your typing speed with WPM and accuracy tracking.' },
  'banner-generator': { Tool: BannerGenerator, module: 'playground', name: 'Banner Generator', description: 'Generate text banners for terminal, README, and CLI headers.' },
  'pixel-art': { Tool: PixelArt, module: 'playground', name: 'Pixel Art', description: 'Draw pixel art on a grid and export as PNG.' },
  'css-gradient': { Tool: CssGradient, module: 'design-studio', name: 'CSS Gradient', description: 'Build and preview CSS gradients with live output.' },
  'border-radius': { Tool: BorderRadius, module: 'design-studio', name: 'Border Radius', description: 'Preview and customize border radius for any shape.' },
  'typography-scale': { Tool: TypographyScale, module: 'design-studio', name: 'Type Scale', description: 'Generate modular type scales with CSS custom properties.' },
  'spacing-system': { Tool: SpacingSystem, module: 'design-studio', name: 'Spacing', description: 'Create consistent spacing tokens for your design system.' },
  'image-compress': { Tool: ImageCompress, module: 'design-studio', name: 'Image Compress', description: 'Shrink image file sizes for web without losing visible quality.' },
  'image-resize': { Tool: ImageResize, module: 'design-studio', name: 'Image Resize', description: 'Scale images to exact pixel dimensions with aspect ratio lock.' },
  'image-convert': { Tool: ImageConvert, module: 'design-studio', name: 'Image Convert', description: 'Convert between PNG, JPEG, and WebP formats.' },
  'contrast-checker': { Tool: ContrastChecker, module: 'design-studio', name: 'Contrast Checker', description: 'Check WCAG contrast ratios for accessible text on any background.' },
  'favicon-generator': { Tool: FaviconGenerator, module: 'design-studio', name: 'Favicon Gen', description: 'Generate favicons in all standard sizes from any image.' },
  'logo-builder': { Tool: LogoBuilder, module: 'design-studio', name: 'Logo Builder', description: 'Build logos with shapes, icons, and text. Export as PNG.' },
  'utm-builder': { Tool: UtmBuilder, module: 'marketing-lab', name: 'UTM Builder', description: 'Build campaign tracking URLs with UTM parameters.' },
  'seo-meta': { Tool: SeoMeta, module: 'marketing-lab', name: 'SEO Meta', description: 'Generate meta tags and preview search result snippets.' },
  'social-counter': { Tool: SocialCounter, module: 'marketing-lab', name: 'Social Counter', description: 'Check character counts across social platforms.' },
  'color-palette': { Tool: ColorPalette, module: 'marketing-lab', name: 'Color Palette', description: 'Generate harmonious color palettes from any base color.' },
  'og-preview': { Tool: OgPreview, module: 'marketing-lab', name: 'OG Preview', description: 'Preview how your page looks on Twitter, Facebook, and LinkedIn.' },
  'social-resizer': { Tool: SocialResizer, module: 'marketing-lab', name: 'Social Resizer', description: 'Crop and resize images to exact social media platform dimensions.' },
  'invoice-generator': { Tool: InvoiceGenerator, module: 'freelance-core', name: 'Invoice', description: 'Create professional invoices with line items, totals, and tax.' },
  'rate-calculator': { Tool: RateCalculator, module: 'freelance-core', name: 'Rate Calc', description: 'Calculate hourly and daily rates with overhead and tax.' },
  'time-tracker': { Tool: TimeTracker, module: 'freelance-core', name: 'Time Tracker', description: 'Track time with a live timer or manual entry.' },
  'expense-tracker': { Tool: ExpenseTracker, module: 'freelance-core', name: 'Expenses', description: 'Log and categorize business expenses.' },
  'contract-templates': { Tool: ContractTemplates, module: 'freelance-core', name: 'Contracts', description: 'Pre-built contract templates with variable inputs.' },
  'client-manager': { Tool: ClientManager, module: 'freelance-core', name: 'Clients', description: 'Organize client information and project notes.' },
  'tax-estimator': { Tool: TaxEstimator, module: 'freelance-core', name: 'Tax Estimator', description: 'Estimate US federal income tax by bracket with effective rate.' },
  'timezone-converter': { Tool: TimezoneConverter, module: 'freelance-core', name: 'Timezone', description: 'Convert times across multiple time zones with meeting planner.' },
  'project-manager': { Tool: ProjectManager, module: 'freelance-core', name: 'Projects', description: 'Manage all projects across clients — create, track, and organize.' },
  'image-crop': { Tool: ImageCrop, module: 'design-studio', name: 'Image Crop', description: 'Crop images with interactive handles and preset aspect ratios.' },
  'image-filters': { Tool: ImageFilters, module: 'design-studio', name: 'Image Filters', description: 'Apply grayscale, sepia, brightness, contrast, blur, and sharpen filters.' },
  'image-metadata': { Tool: ImageMetadata, module: 'design-studio', name: 'Image Metadata', description: 'Read and strip EXIF metadata from images.' },
  'font-pairer': { Tool: FontPairer, module: 'design-studio', name: 'Font Pairer', description: 'Browse curated font pairings for headings and body text.' },
  'brand-kit': { Tool: BrandKit, module: 'design-studio', name: 'Brand Kit', description: 'Build and export your brand colors, fonts, and logo as CSS.' },
  'pdf-merge': { Tool: PdfMerge, module: 'workers-suite', name: 'PDF Merge', description: 'Combine multiple PDF files into one with drag-to-reorder.' },
  'pdf-split': { Tool: PdfSplit, module: 'workers-suite', name: 'PDF Split', description: 'Extract specific pages or split every page into individual PDFs.' },
  'pdf-compress': { Tool: PdfCompress, module: 'workers-suite', name: 'PDF Compress', description: 'Reduce PDF file size by stripping unused objects and metadata.' },
  'pdf-protect': { Tool: PdfProtect, module: 'workers-suite', name: 'PDF Protect', description: 'Add or remove password protection from PDF files.' },
  'pdf-sign': { Tool: PdfSign, module: 'workers-suite', name: 'PDF Sign', description: 'Place a visual signature on PDF — draw, type, or upload.' },
  'pdf-to-images': { Tool: PdfToImages, module: 'workers-suite', name: 'PDF to Images', description: 'Convert PDF pages to PNG images at configurable DPI.' },
  'pdf-metadata': { Tool: PdfMetadata, module: 'workers-suite', name: 'PDF Metadata', description: 'View and edit PDF metadata — title, author, keywords, and more.' },
};

const MODULE_NAMES: Record<string, string> = {
  'workers-suite': "Worker's Suite",
  'playground': 'Playground',
  'design-studio': 'Design Studio',
  'marketing-lab': 'Marketing Lab',
  'freelance-core': 'Freelance Core',
};

interface HomeTab {
  id: string;
  label: string;
  icon: string;
}

const HOME_TABS: HomeTab[] = [
  { id: 'home', label: 'Home', icon: ICONS.home },
  { id: 'workers-suite', label: 'Workers', icon: ICONS.workers },
  { id: 'playground', label: 'Play', icon: ICONS.play },
  { id: 'design-studio', label: 'Design', icon: ICONS.design },
  { id: 'marketing-lab', label: 'Marketing', icon: ICONS.marketing },
  { id: 'freelance-core', label: 'Freelance', icon: ICONS.freelance },
];

interface ToolInstance {
  tool: Tool;
  view: ToolView;
  initialized: boolean;
}

export class Home {
  private workspace: HTMLElement;
  private moduleId = 'home';
  private toolInstances = new Map<string, ToolInstance>();
  private activeToolId: string | null = null;
  private gridView: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private navTabsEl: HTMLDivElement | null = null;
  private _routeHandler: ((data: any) => void) | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private locale = 'en-US';
  private activityLog: ActivityLog | null = null;

  constructor(workspace: HTMLElement) {
    this.workspace = workspace;
  }

  async render(): Promise<void> {
    this.workspace.className = 'workspace';
    this.addModuleStyles();
    this.activityLog = new ActivityLog();

    this.container = document.createElement('div');
    this.container.className = 'module-container';
    this.container.style.gridColumn = '1 / -1';
    this.workspace.appendChild(this.container);

    this.renderGrid().catch(err => {
      console.error('Home renderGrid failed:', err);
      this.container!.innerHTML = `
        <div class="module-grid" style="grid-column:1/-1;min-height:60vh;display:flex;align-items:center;justify-content:center;">
          <div class="home-widget-empty" style="max-width:400px;text-align:center;">
            <p>Something went wrong loading the dashboard.</p>
            <button class="btn btn--primary btn--sm" onclick="location.reload()">Reload</button>
          </div>
        </div>
      `;
    });

    this._routeHandler = ({ current }: { current: { module: string | null; tool: string | null } }) => {
      this.setActiveTab(current.module || 'home');
      if (current.module !== this.moduleId) return;
      if (current.tool) this.showTool(current.tool);
      else this.hideTool();
    };
    events.on(ROUTES.CHANGE, this._routeHandler);

    const route = router.getRoute();
    this.setActiveTab(route.module || 'home');
    if (route.module === this.moduleId && route.tool) this.showTool(route.tool);
  }

  private async renderGrid(): Promise<void> {
    this.gridView = document.createElement('div');
    this.gridView.className = 'module-grid';

    // Dynamic greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const userName = await db.getPreference('userName', '') as string;
    const greetName = userName ? `, ${userName}` : '';

    const header = document.createElement('div');
    header.className = 'module-header fade-in';
    header.innerHTML = `
      <div class="module-banner">
        <img src="/banners/workers-suite.svg" alt="inztun — The Artisan's Operating System" class="module-banner__img">
      </div>
      <div class="module-header__content">
        <h1 class="module-header__title">${greeting}${greetName}</h1>
        <p class="module-header__desc">Your command center. Star tools for quick access.</p>
      </div>
    `;
    this.gridView.appendChild(header);

    const nav = this.renderNav();
    this.gridView.appendChild(nav);

    // Load all data in parallel — each call is individually safe
    const [
      activeTimer, invoices, usage, projects, clients, activity, notes, defaultLocale, defaultCurrency,
      wsFavorites, fcFavorites, dsFavorites, mlFavorites, pgFavorites
    ] = await Promise.all([
      db.getPreference('fc-active-timer').catch(() => null),
      db.getHistory('invoice', 100).catch(() => []),
      db.getToolUsage().catch(() => ({})),
      db.getAllProjects().catch(() => []),
      db.getAllClients().catch(() => []),
      db.getRecentActivity(10).catch(() => []),
      db.getAllNotes().catch(() => []),
      db.getPreference('defaultLocale', 'en-US').catch(() => 'en-US'),
      db.getPreference('defaultCurrency', 'USD').catch(() => 'USD'),
      db.getPreference('ws-favorites', []).catch(() => []),
      db.getPreference('fc-favorites', []).catch(() => []),
      db.getPreference('ds-favorites', []).catch(() => []),
      db.getPreference('ml-favorites', []).catch(() => []),
      db.getPreference('pg-favorites', []).catch(() => []),
    ]) as [
      { project: string; startTime: number } | null,
      Array<{ id: number; tool: string; data: unknown; timestamp: number }>,
      Record<string, number>,
      Array<{ id: number; clientId: number; name: string; status: string; deadline?: string; budget?: number; currency?: string }>,
      Array<{ id: number; name: string }>,
      Array<{ id: number; type: string; label: string; createdAt: number }>,
      Array<{ id: number; title: string; content: string; updatedAt: number }>,
      string,
      string,
      string[], string[], string[], string[], string[],
    ];
    this.locale = defaultLocale || 'en-US';
    const allFavorites = [...new Set([...wsFavorites, ...fcFavorites, ...dsFavorites, ...mlFavorites, ...pgFavorites])];

    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);

    // ── Stats Row ──
    const statsRow = document.createElement('div');
    statsRow.className = 'home-stats fade-in';

    // Timer widget
    const timerWidget = document.createElement('div');
    timerWidget.className = 'home-stat-widget';
    if (activeTimer) {
      const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      timerWidget.classList.add('home-stat-widget--active');
      timerWidget.innerHTML = `
        <div class="home-stat-widget__header">
          <span class="home-stat-widget__label">Active Timer</span>
          <span class="home-stat-widget__pulse"></span>
        </div>
        <div class="home-stat-widget__value">${timeStr}</div>
        <div class="home-stat-widget__detail">${activeTimer.project}</div>
        <button class="btn btn--ghost btn--sm home-stat-widget__action" id="home-stop-timer">Stop</button>
      `;
      setTimeout(() => {
        document.getElementById('home-stop-timer')?.addEventListener('click', () => {
          db.setPreference('fc-active-timer', null);
          router.navigate('freelance-core', 'time-tracker');
        });
      }, 0);
    } else {
      timerWidget.innerHTML = `
        <div class="home-stat-widget__header">
          <span class="home-stat-widget__label">Timer</span>
        </div>
        <div class="home-stat-widget__value home-stat-widget__value--muted">--:--:--</div>
        <div class="home-stat-widget__detail">No active timer</div>
      `;
    }
    timerWidget.addEventListener('click', () => router.navigate('freelance-core', 'time-tracker'));
    timerWidget.style.cursor = 'pointer';
    statsRow.appendChild(timerWidget);

    // Live timer tick
    if (activeTimer) {
      const valueEl = timerWidget.querySelector('.home-stat-widget__value')!;
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        valueEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }, 1000);
    }

    // Invoice widget
    const invWidget = document.createElement('div');
    invWidget.className = 'home-stat-widget';
    const invoiceCount = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => {
      const data = inv.data as Record<string, unknown>;
      const items = (data?.items || []) as Array<{ quantity: number; rate: number }>;
      return sum + items.reduce((s, item) => s + (item.quantity || 0) * (item.rate || 0), 0);
    }, 0);
    if (invoiceCount > 0) {
      invWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Invoices</span></div>
        <div class="home-stat-widget__value">${invoiceCount}</div>
        <div class="home-stat-widget__detail">${getCurrencySymbol(defaultCurrency as string || 'USD')}${totalAmount.toFixed(0)} total</div>
      `;
    } else {
      invWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Invoices</span></div>
        <div class="home-stat-widget__value home-stat-widget__value--muted">0</div>
        <div class="home-stat-widget__detail">No invoices yet — create your first</div>
      `;
    }
    invWidget.addEventListener('click', () => router.navigate('freelance-core', 'invoice-generator'));
    invWidget.style.cursor = 'pointer';
    statsRow.appendChild(invWidget);

    // Quick Notes widget (inside stats row)
    const notesWidget = document.createElement('div');
    notesWidget.className = 'home-stat-widget home-stat-widget--notes';
    const recentNotes = notes.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
    if (recentNotes.length > 0) {
      notesWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Quick Notes</span></div>
        <div class="home-notes-grid">
          ${recentNotes.map(n => {
            const preview = (n.content || '').replace(/[#*`\[\]>_~-]/g, '').trim().slice(0, 40);
            return `
              <div class="home-note-mini" data-id="${n.id}">
                <div class="home-note-mini__title">${n.title || 'Untitled'}</div>
                <div class="home-note-mini__time">${this.relativeTime(n.updatedAt)}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      setTimeout(() => {
        notesWidget.querySelectorAll('.home-note-mini').forEach(card => {
          card.addEventListener('click', async () => {
            const id = (card as HTMLElement).dataset.id!;
            await db.setPreference('sp-active-note', parseInt(id));
            router.navigate('workers-suite', 'scratchpad');
          });
        });
      }, 0);
    } else {
      notesWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Quick Notes</span></div>
        <div class="home-stat-widget__value home-stat-widget__value--muted">—</div>
        <div class="home-stat-widget__detail">No notes yet</div>
      `;
    }
    notesWidget.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.home-note-mini')) return;
      router.navigate('workers-suite', 'scratchpad');
    });
    notesWidget.style.cursor = 'pointer';
    statsRow.appendChild(notesWidget);

    // Usage chart widget
    const usageWidget = document.createElement('div');
    usageWidget.className = 'home-stat-widget home-stat-widget--wide';
    const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    if (sorted.length > 0) {
      usageWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Most Used Tools</span></div>
        <div class="home-usage-chart">
          ${sorted.map(([id, count]) => {
            const data = ALL_TOOLS[id];
            const name = data ? data.name : id;
            const pct = Math.round((count / maxCount) * 100);
            return `
              <div class="home-usage-bar">
                <span class="home-usage-bar__name">${name}</span>
                <div class="home-usage-bar__track"><div class="home-usage-bar__fill" style="width:${pct}%"></div></div>
                <span class="home-usage-bar__count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      usageWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Most Used Tools</span></div>
        <div class="home-stat-widget__value home-stat-widget__value--muted">—</div>
        <div class="home-stat-widget__detail">Start using tools to see stats</div>
      `;
    }
    statsRow.appendChild(usageWidget);

    // Active Projects widget (in stats row)
    const projWidget = document.createElement('div');
    projWidget.className = 'home-stat-widget home-stat-widget--projects';
    if (activeProjects.length > 0) {
      projWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Active Projects</span></div>
        <div class="home-projects-list">
          ${activeProjects.map(p => {
            const deadline = p.deadline ? this.formatProjectDeadline(p.deadline) : '';
            const isUrgent = p.deadline && this.getDeadlineDays(p.deadline) <= 7 && this.getDeadlineDays(p.deadline) >= 0;
            return `
              <div class="home-project-mini" data-project-id="${p.id}" data-project-name="${p.name}">
                <div class="home-project-mini__name">${p.name}</div>
                <div class="home-project-mini__client">${clientMap.get(p.clientId) || 'Unknown'}</div>
                ${deadline ? `<div class="home-project-mini__deadline ${isUrgent ? 'home-project-mini__deadline--urgent' : ''}">${deadline}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
      setTimeout(() => {
        projWidget.querySelectorAll('.home-project-mini').forEach(card => {
          card.addEventListener('click', () => {
            const projectId = parseInt((card as HTMLElement).dataset.projectId!);
            const projectName = (card as HTMLElement).dataset.projectName!;
            db.setPreference('fc-preselect-project', { projectId, projectName });
            router.navigate('freelance-core', 'time-tracker');
          });
        });
      }, 0);
    } else {
      projWidget.innerHTML = `
        <div class="home-stat-widget__header"><span class="home-stat-widget__label">Active Projects</span></div>
        <div class="home-stat-widget__value home-stat-widget__value--muted">—</div>
        <div class="home-stat-widget__detail">No active projects</div>
      `;
    }
    projWidget.style.cursor = 'pointer';
    projWidget.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.home-project-mini')) return;
      router.navigate('freelance-core', 'project-manager');
    });
    statsRow.appendChild(projWidget);

    this.gridView.appendChild(statsRow);

    // ── Quick Actions ──
    const quickActions = document.createElement('div');
    quickActions.className = 'home-quick-actions fade-in';
    quickActions.innerHTML = `
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="new-invoice">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        New Invoice
      </button>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="start-timer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Start Timer
      </button>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="new-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        New Note
      </button>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="new-client">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        New Client
      </button>
      <span class="home-qa-divider"></span>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="settings">
        ${ICONS.settings}
        Settings
      </button>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="defaults">
        ${ICONS.defaults}
        Defaults
      </button>
      <button class="btn btn--ghost btn--sm home-qa-btn" data-action="shortcuts">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>
        Shortcuts
      </button>
    `;
    this.gridView.appendChild(quickActions);

    setTimeout(() => {
      quickActions.querySelectorAll('.home-qa-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const action = (btn as HTMLElement).dataset.action;
          switch (action) {
            case 'new-invoice': router.navigate('freelance-core', 'invoice-generator'); break;
            case 'start-timer': router.navigate('freelance-core', 'time-tracker'); break;
            case 'new-note':
              const note = await db.createNote({ title: '', content: '' });
              await db.setPreference('sp-active-note', note.id);
              router.navigate('workers-suite', 'scratchpad');
              break;
            case 'new-client': router.navigate('freelance-core', 'client-manager'); break;
            case 'settings': events.emit('palette:open-settings'); break;
            case 'defaults': events.emit('palette:open-defaults'); break;
            case 'shortcuts': events.emit('shortcuts:open'); break;
          }
        });
      });
    }, 0);

    // ── Activity Feed ──
    const actSection = document.createElement('div');
    actSection.className = 'home-activity fade-in';
    if (activity.length > 0) {
      actSection.innerHTML = `
        <div class="home-section-label"><span>Recent Activity</span><button class="btn btn--ghost btn--sm" id="al-view-all">View All</button></div>
        <div class="home-activity__list">
          ${activity.map(a => `
            <div class="home-activity-item" data-type="${a.type}" data-meta="${a.meta || ''}">
              <span class="home-activity-item__icon">${this.getActivityIcon(a.type)}</span>
              <span class="home-activity-item__label">${a.label}</span>
              <span class="home-activity-item__time">${this.relativeTime(a.createdAt)}</span>
            </div>
          `).join('')}
        </div>
      `;
      setTimeout(() => {
        actSection.querySelectorAll('.home-activity-item').forEach(item => {
          item.addEventListener('click', () => {
            const type = (item as HTMLElement).dataset.type;
            const meta = (item as HTMLElement).dataset.meta;
            switch (type) {
              case 'invoice': router.navigate('freelance-core', 'invoice-generator'); break;
              case 'client-add':
              case 'client-update': router.navigate('freelance-core', 'client-manager'); break;
              case 'project-create':
              case 'project-update': router.navigate('freelance-core', 'client-manager'); break;
              case 'note-create': router.navigate('workers-suite', 'scratchpad'); break;
              case 'tool-action': {
                const toolId = meta;
                const wsTools = ['pdf-merge','pdf-split','pdf-compress','pdf-protect','pdf-sign','pdf-to-images','pdf-metadata','lorem-ipsum','char-counter','base64','url-encoder','json-formatter','hash-generator','uuid-generator','password-generator','css-unit','markdown-preview','markdown-html','scratchpad'];
                const dsTools = ['css-gradient','border-radius','typography-scale','spacing-system','image-compress','image-resize','image-convert','contrast-checker','favicon-generator','logo-builder','image-crop','image-filters','image-metadata','font-pairer','brand-kit'];
                const mlTools = ['utm-builder','social-resizer','social-counter','seo-meta','og-preview','color-palette'];
                const fcTools = ['invoice-generator','time-tracker','rate-calculator','contract-templates','expense-tracker','client-manager','tax-estimator','timezone-converter','project-manager'];
                if (wsTools.includes(toolId)) router.navigate('workers-suite', toolId);
                else if (dsTools.includes(toolId)) router.navigate('design-studio', toolId);
                else if (mlTools.includes(toolId)) router.navigate('marketing-lab', toolId);
                else if (fcTools.includes(toolId)) router.navigate('freelance-core', toolId);
                break;
              }
              default: router.navigate('home');
            }
          });
        });
      }, 0);
    } else {
      actSection.innerHTML = `
        <div class="home-section-label"><span>Recent Activity</span></div>
        <div class="home-widget-empty">
          <p>No activity yet. Start using tools to see your activity here.</p>
        </div>
      `;
    }
    this.gridView.appendChild(actSection);

    // View All button
    setTimeout(() => {
      const viewAllBtn = actSection.querySelector('#al-view-all');
      viewAllBtn?.addEventListener('click', () => this.activityLog?.open());
    }, 0);

    // ── Favorites ──
    const favSection = document.createElement('div');
    favSection.className = 'home-favorites fade-in';
    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'home-section-label';
    sectionLabel.innerHTML = '<span>Favorites</span>';
    favSection.appendChild(sectionLabel);

    const grid = document.createElement('div');
    grid.className = 'bento-grid';

    if (allFavorites.length === 0) {
      grid.innerHTML = `
        <div class="home-widget-empty" style="grid-column: 1 / -1;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p>No favorites yet. Star any tool to pin it here.</p>
          <button class="btn btn--ghost btn--sm" id="home-explore">Explore Tools</button>
        </div>
      `;
      setTimeout(() => {
        document.getElementById('home-explore')?.addEventListener('click', () => {
          router.navigate('workers-suite');
        });
      }, 0);
    } else {
      allFavorites.forEach((toolId, index) => {
        const toolData = ALL_TOOLS[toolId];
        if (!toolData) return;
        const tool = new toolData.Tool();
        const card = this.createToolCard(toolId, tool, toolData.module, index);
        grid.appendChild(card);
      });
    }
    favSection.appendChild(grid);
    this.gridView.appendChild(favSection);

    this.container!.appendChild(this.gridView);
  }

  private renderNav(): HTMLDivElement {
    const nav = document.createElement('div');
    nav.className = 'home-nav fade-in';

    this.navTabsEl = document.createElement('div');
    this.navTabsEl.className = 'home-nav__tabs';
    this.navTabsEl.innerHTML = HOME_TABS.map(tab => `
      <button class="home-nav__tab ${tab.id === this.moduleId ? 'home-nav__tab--active' : ''}" data-module="${tab.id}">
        <span class="home-nav__tab-icon">${tab.icon}</span>
        <span class="home-nav__tab-label">${tab.label}</span>
      </button>
    `).join('');
    nav.appendChild(this.navTabsEl);

    this.navTabsEl.querySelectorAll('.home-nav__tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleId = (btn as HTMLElement).dataset.module!;
        router.navigate(moduleId);
      });
    });

    return nav;
  }

  private setActiveTab(moduleId: string): void {
    if (!this.navTabsEl) return;
    this.navTabsEl.querySelectorAll('.home-nav__tab').forEach(tab => {
      const isActive = (tab as HTMLElement).dataset.module === moduleId;
      tab.classList.toggle('home-nav__tab--active', isActive);
    });
  }

  private formatProjectDeadline(deadline: string): string {
    const d = new Date(deadline + 'T00:00:00');
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `${diffDays}d left`;
    return d.toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }

  private getDeadlineDays(deadline: string): number {
    const d = new Date(deadline + 'T00:00:00');
    const now = new Date();
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private relativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }

  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'invoice': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      'client-add': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>',
      'client-update': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>',
      'note-create': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      'project-create': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      'project-update': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
      'tool-action': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    };
    return icons[type] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  private createToolCard(toolId: string, tool: Tool, moduleId: string, index: number): HTMLElement {
    const moduleName = MODULE_NAMES[moduleId] || moduleId;

    const card = new Tile({
      title: tool.name,
      icon: tool.icon,
      badge: moduleName,
      content: `
        <div class="tile__spacer"></div>
        <span class="tile__open-label">Open →</span>
      `,
      span: { col: 4, row: 1 },
    });

    const element = card.render();
    element.classList.add('tile--clickable');
    element.style.animationDelay = `${index * 60}ms`;
    element.addEventListener('click', () => router.navigate(moduleId, toolId));
    return element;
  }

  private showTool(toolId: string): void {
    const toolData = ALL_TOOLS[toolId];
    if (!toolData) return;

    if (this.gridView) this.gridView.style.display = 'none';

    if (!this.toolInstances.has(toolId)) {
      const tool = new toolData.Tool();
      const currentIndex = Object.keys(ALL_TOOLS).indexOf(toolId);
      const toolsList = Object.entries(ALL_TOOLS).map(([id, data]) => ({ id, name: data.name }));

      const viewOptions: ToolViewOptions = {
        toolId,
        toolName: tool.name,
        toolIcon: tool.icon,
        toolDescription: toolData.description || '',
        moduleId: toolData.module,
        tools: toolsList,
        currentIndex,
      };

      const view = new ToolView(this.container!, viewOptions);
      const contentEl = view.render();
      const toolWorkspace = document.createElement('div');
      toolWorkspace.className = 'tool-workspace';
      toolWorkspace.innerHTML = tool.render();
      contentEl.appendChild(toolWorkspace);

      this.toolInstances.set(toolId, { tool, view, initialized: false });
    }

    this.toolInstances.forEach((instance, id) => {
      id === toolId ? instance.view.show() : instance.view.hide();
    });

    const instance = this.toolInstances.get(toolId)!;
    if (!instance.initialized) {
      requestAnimationFrame(() => {
        instance.tool.init?.(instance.view.contentEl!);
        instance.view.focusFirstInput();
      });
      instance.initialized = true;
    } else {
      instance.view.focusFirstInput();
    }

    this.activeToolId = toolId;
  }

  private hideTool(): void {
    this.toolInstances.forEach(instance => instance.view.hide());
    if (this.gridView) this.gridView.style.display = '';
    this.activeToolId = null;
  }

  private addModuleStyles(): void {
    if (document.getElementById('home-styles')) return;
    const style = document.createElement('style');
    style.id = 'home-styles';
    style.textContent = `
      .home-nav {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4) 0;
        margin-bottom: var(--space-2);
      }
      .home-nav__tabs {
        display: flex;
        gap: var(--space-1);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .home-nav__tabs::-webkit-scrollbar { display: none; }
      .home-nav__tab {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-3);
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        cursor: pointer;
        border-radius: var(--radius-md);
        transition: all 150ms ease;
        white-space: nowrap;
      }
      .home-nav__tab:hover {
        color: var(--text-primary);
        background: var(--bg-glass);
      }
      .home-nav__tab--active {
        color: var(--accent);
        background: var(--accent-dim);
      }
      .home-nav__tab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }
      .home-nav__tab-icon svg {
        width: 16px;
        height: 16px;
      }
      .home-nav__tab-label {
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .home-empty {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }
      .home-empty__content {
        text-align: center;
        color: var(--text-muted);
      }
      .home-empty__content svg {
        margin-bottom: var(--space-4);
        opacity: 0.3;
      }
      .home-empty__content h3 {
        font-family: var(--font-display);
        font-size: var(--text-xl);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }
      .home-empty__content p {
        font-size: var(--text-sm);
        margin-bottom: var(--space-4);
      }
      .home-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .home-stat-widget {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-4);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        transition: border-color 150ms ease;
      }
      .home-stat-widget:hover {
        border-color: var(--border-subtle);
      }
      .home-stat-widget--active {
        border-color: var(--accent-border);
        animation: home-pulse-border 2s ease-in-out infinite;
      }
      @keyframes home-pulse-border {
        0%, 100% { border-color: var(--accent-border); box-shadow: 0 0 0 0 var(--accent-glow); }
        50% { border-color: var(--accent); box-shadow: 0 0 12px 0 var(--accent-glow); }
      }
      .home-stat-widget__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .home-stat-widget__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .home-stat-widget__pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        animation: home-pulse-dot 1.5s ease-in-out infinite;
      }
      @keyframes home-pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .home-stat-widget__value {
        font-family: var(--font-mono);
        font-size: var(--text-2xl);
        font-weight: 500;
        color: var(--accent);
        line-height: 1;
      }
      .home-stat-widget__value--muted {
        color: var(--text-ghost);
      }
      .home-stat-widget__detail {
        font-size: var(--text-xs);
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .home-stat-widget__action {
        margin-top: var(--space-1);
        align-self: flex-start;
      }
      .home-section-label {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .home-section-label span {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        flex: 1;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .home-projects {
        margin-bottom: var(--space-4);
      }
      .home-projects__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
      }
      .home-project-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-md);
        transition: border-color 150ms ease;
      }
      .home-project-card:hover {
        border-color: var(--accent-border);
      }
      .home-project-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .home-project-card__name {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
      }
      .home-project-card__budget {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--accent);
      }
      .home-project-card__client {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .home-project-card__deadline {
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--color-warning);
      }
      .home-project-card__timer {
        margin-top: var(--space-1);
        align-self: flex-start;
      }
      .home-quick-actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }
      .home-qa-btn {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-xs) !important;
      }
      .home-qa-btn svg {
        width: 14px;
        height: 14px;
      }
      .home-qa-divider {
        width: 1px;
        height: 24px;
        background: var(--border-hairline);
        align-self: center;
      }
      .home-activity {
        margin-bottom: var(--space-4);
      }
      .home-activity__list {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .home-activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        background: var(--bg-deep);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        cursor: pointer;
        transition: border-color 150ms ease;
      }
      .home-activity-item:hover {
        border-color: var(--accent-border);
      }
      .home-activity-item__icon {
        color: var(--text-muted);
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }
      .home-activity-item__label {
        flex: 1;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .home-activity-item__time {
        color: var(--text-ghost);
        font-family: var(--font-mono);
        flex-shrink: 0;
      }
      .home-project-card__deadline--urgent {
        color: var(--color-error) !important;
      }
      .home-widget-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        background: var(--bg-deep);
        border: 1px dashed var(--border-hairline);
        border-radius: var(--radius-md);
        text-align: center;
        color: var(--text-muted);
      }
      .home-widget-empty p {
        font-size: var(--text-sm);
        margin: 0;
      }
      .home-favorites {
        margin-bottom: var(--space-4);
      }

      /* ── Usage Chart ── */
      .home-stat-widget--wide {
        grid-column: span 2;
      }
      .home-usage-chart {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-top: var(--space-1);
      }
      .home-usage-bar {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .home-usage-bar__name {
        width: 100px;
        font-size: var(--text-xs);
        color: var(--text-secondary);
        text-align: right;
        flex-shrink: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .home-usage-bar__track {
        flex: 1;
        height: 8px;
        background: var(--bg-deep);
        border-radius: 4px;
        overflow: hidden;
      }
      .home-usage-bar__fill {
        height: 100%;
        background: var(--accent);
        border-radius: 4px;
        transition: width 300ms ease;
        opacity: 0.7;
      }
      .home-usage-bar__count {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-muted);
        width: 30px;
        text-align: right;
      }

      /* ── Quick Notes (in stats row) ── */
      .home-stat-widget--notes {
        cursor: pointer;
      }
      .home-notes-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-1);
        max-height: 160px;
        overflow-y: auto;
        margin-top: var(--space-1);
      }
      .home-notes-grid::-webkit-scrollbar {
        width: 4px;
      }
      .home-notes-grid::-webkit-scrollbar-thumb {
        background: var(--border-hairline);
        border-radius: 2px;
      }
      .home-note-mini {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--space-2);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: border-color 150ms ease;
        min-width: 0;
      }
      .home-note-mini:hover {
        border-color: var(--accent-border);
      }
      .home-note-mini__title {
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .home-note-mini__time {
        font-size: 10px;
        color: var(--text-ghost);
        font-family: var(--font-mono);
      }

      /* ── Active Projects (in stats row) ── */
      .home-stat-widget--projects {
        cursor: pointer;
      }
      .home-projects-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        max-height: 160px;
        overflow-y: auto;
        margin-top: var(--space-1);
      }
      .home-projects-list::-webkit-scrollbar {
        width: 4px;
      }
      .home-projects-list::-webkit-scrollbar-thumb {
        background: var(--border-hairline);
        border-radius: 2px;
      }
      .home-project-mini {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--space-2);
        background: var(--bg-glass);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: border-color 150ms ease;
      }
      .home-project-mini:hover {
        border-color: var(--accent-border);
      }
      .home-project-mini__name {
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .home-project-mini__client {
        font-size: 10px;
        color: var(--text-muted);
      }
      .home-project-mini__deadline {
        font-size: 10px;
        font-family: var(--font-mono);
        color: var(--color-warning);
      }
      .home-project-mini__deadline--urgent {
        color: var(--color-error) !important;
      }

      @media (max-width: 768px) {
        .home-nav__tab-label {
          display: none;
        }
        .home-hero {
          padding: var(--space-4) 0 var(--space-2);
        }
        .home-hero__title {
          font-size: var(--text-2xl);
        }
        .home-hero__desc {
          font-size: var(--text-xs);
        }
        .home-section__title {
          font-size: var(--text-xs);
        }
        .home-stats {
          grid-template-columns: 1fr;
        }
        .home-projects__grid {
          grid-template-columns: 1fr;
        }
        .home-quick-actions {
          flex-wrap: wrap;
        }
        .home-stat-widget--wide {
          grid-column: span 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this._routeHandler) events.off(ROUTES.CHANGE, this._routeHandler);
    this.activityLog?.destroy();
    this.activityLog = null;
    this.toolInstances.forEach(({ view, tool }) => { tool.destroy?.(); view.destroy(); });
    this.toolInstances.clear();
    this.navTabsEl = null;
    this.workspace.innerHTML = '';
  }
}
