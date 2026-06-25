import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import type { Tool } from '../../../types';
import { copyToClipboard } from '../../../utils/image';
import {
  BOARD,
  type BrandData,
  contrastRatio,
  drawBrowserMockup,
  drawCard,
  drawCheckCross,
  drawConstructionGrid,
  drawLogoPlaceholder,
  drawPanelBase,
  drawSwatchRow,
  generateHarmony,
  hexToHsl,
  hslToHex,
  panelAt,
  roundRect,
} from './brand-kit-renderer';

const PANEL_LABELS = [
  'Logo Cover',
  'Color System',
  'Typography',
  'Construction',
  'Digital Application',
  'Brand Essence',
  "Do's & Don'ts",
  'Spacing & Tokens',
  'Applications',
];

const FONT_OPTIONS = [
  'Montserrat, sans-serif',
  'Playfair Display, serif',
  'Poppins, sans-serif',
  'Oswald, sans-serif',
  'Raleway, sans-serif',
  'Lora, serif',
  'DM Serif Display, serif',
  'Bebas Neue, sans-serif',
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Source Sans Pro, sans-serif',
  'Merriweather, serif',
  'Fira Sans, sans-serif',
  'Space Grotesk, sans-serif',
  'DM Sans, sans-serif',
  'Nunito, sans-serif',
];

export class BrandGuidelines implements Tool {
  id = 'brand-guidelines';
  name = 'Brand Guidelines';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18"/><path d="M9 3v18"/>
  </svg>`;

  private brand: BrandData = {
    name: '',
    tagline: '',
    logoDataUrl: '',
    colors: ['#1a1a1a', '#c9a96e', '#ffffff'],
    fonts: { heading: 'Montserrat, sans-serif', body: 'Inter, sans-serif' },
  };
  private logoImg: HTMLImageElement | null = null;
  private scale = 2;

  render(): string {
    return `
      <div class="tool-area">
        <div class="bgl-layout">
          <div class="bgl-controls">
            <div class="form-group">
              <label class="label">Brand Name</label>
              <input type="text" class="input" id="bgl-name" placeholder="My Brand" value="${this.brand.name}">
            </div>
            <div class="form-group">
              <label class="label">Tagline</label>
              <input type="text" class="input" id="bgl-tagline" placeholder="Your brand tagline" value="${this.brand.tagline}">
            </div>
            <div class="form-group">
              <label class="label">Logo</label>
              <div class="bgl-logo-upload" id="bgl-logo-upload">
                <input type="file" accept="image/*" id="bgl-logo-input" hidden>
                <div class="bgl-logo-preview" id="bgl-logo-preview">
                  <span class="bgl-logo-placeholder">Click to upload logo</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Brand Colors</label>
              <div class="bgl-colors" id="bgl-colors">
                ${this.brand.colors
                  .map(
                    (c, i) => `
                  <div class="bgl-color-item">
                    <input type="color" value="${c}" class="bgl-color-input" data-i="${i}">
                    <span class="bgl-color-hex">${c}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
              <div class="bgl-color-actions">
                <button class="btn btn--ghost btn--sm" id="bgl-add-color">+ Add</button>
                <button class="btn btn--ghost btn--sm" id="bgl-random-colors">Randomize</button>
                <button class="btn btn--ghost btn--sm" id="bgl-gen-palette">Generate Palette</button>
              </div>
            </div>
            <div class="form-group" id="bgl-palette-section" style="display:none;">
              <label class="label">Generated Palettes</label>
              <div class="bgl-palette-grid" id="bgl-palette-grid"></div>
            </div>
            <div class="form-group">
              <label class="label">Heading Font</label>
              <select class="input" id="bgl-heading-font">
                ${FONT_OPTIONS.map((f) => `<option value="${f}" ${f === this.brand.fonts.heading ? 'selected' : ''}>${f.split(',')[0]}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="label">Body Font</label>
              <select class="input" id="bgl-body-font">
                ${FONT_OPTIONS.map((f) => `<option value="${f}" ${f === this.brand.fonts.body ? 'selected' : ''}>${f.split(',')[0]}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="label">Load Saved Kit</label>
              <select class="input" id="bgl-saved-kit"><option value="">— Select —</option></select>
            </div>
            <div class="form-group">
              <label class="label">Resolution</label>
              <select class="input" id="bgl-scale">
                <option value="1">1x (1920x1440)</option>
                <option value="2" selected>2x (3840x2880)</option>
              </select>
            </div>
            <div class="tool-actions">
              <button class="btn btn--ghost" id="bgl-save">Save Kit</button>
              <button class="btn btn--ghost" id="bgl-export-css">Export CSS</button>
              <button class="btn btn--ghost" id="bgl-preview-btn">Preview</button>
              <button class="btn btn--ghost" id="bgl-export-png">Download PNG</button>
              <button class="btn btn--primary" id="bgl-export-pdf">Download PDF</button>
            </div>
          </div>
          <div class="bgl-preview-area">
            <canvas id="bgl-canvas" width="${BOARD.width}" height="${BOARD.height}" class="bgl-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const canvas = root.querySelector('#bgl-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const nameInput = root.querySelector('#bgl-name') as HTMLInputElement;
    const taglineInput = root.querySelector('#bgl-tagline') as HTMLInputElement;
    const logoUpload = root.querySelector('#bgl-logo-upload')!;
    const logoInput = root.querySelector('#bgl-logo-input') as HTMLInputElement;
    const logoPreview = root.querySelector('#bgl-logo-preview')!;
    const colorsEl = root.querySelector('#bgl-colors')!;
    const headingFont = root.querySelector('#bgl-heading-font') as HTMLSelectElement;
    const bodyFont = root.querySelector('#bgl-body-font') as HTMLSelectElement;
    const savedKitSelect = root.querySelector('#bgl-saved-kit') as HTMLSelectElement;
    const scaleSelect = root.querySelector('#bgl-scale') as HTMLSelectElement;

    nameInput.addEventListener('input', () => {
      this.brand.name = nameInput.value;
    });
    taglineInput.addEventListener('input', () => {
      this.brand.tagline = taglineInput.value;
    });

    logoUpload.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.brand.logoDataUrl = reader.result as string;
        logoPreview.innerHTML = `<img src="${this.brand.logoDataUrl}" style="max-width:100%;max-height:60px;">`;
        this.loadLogoImage();
      };
      reader.readAsDataURL(file);
    });

    const renderColors = () => {
      colorsEl.innerHTML = this.brand.colors
        .map(
          (c, i) => `
        <div class="bgl-color-item">
          <input type="color" value="${c}" class="bgl-color-input" data-i="${i}">
          <span class="bgl-color-hex">${c}</span>
          ${this.brand.colors.length > 1 ? `<button class="btn btn--ghost btn--sm bgl-color-remove" data-i="${i}">×</button>` : ''}
        </div>
      `,
        )
        .join('');
      colorsEl.querySelectorAll('.bgl-color-input').forEach((el) => {
        el.addEventListener('input', (e) => {
          const i = parseInt((e.target as HTMLElement).dataset.i!);
          this.brand.colors[i] = (e.target as HTMLInputElement).value;
          (e.target as HTMLElement)
            .closest('.bgl-color-item')!
            .querySelector('.bgl-color-hex')!.textContent = this.brand.colors[i];
        });
      });
      colorsEl.querySelectorAll('.bgl-color-remove').forEach((el) => {
        el.addEventListener('click', (e) => {
          this.brand.colors.splice(parseInt((e.target as HTMLElement).dataset.i!), 1);
          renderColors();
        });
      });
    };

    root.querySelector('#bgl-add-color')!.addEventListener('click', () => {
      this.brand.colors.push('#6366f1');
      renderColors();
    });

    root.querySelector('#bgl-random-colors')!.addEventListener('click', () => {
      this.randomizeColors();
      renderColors();
      Toast.info('Random palette generated');
    });

    root.querySelector('#bgl-gen-palette')!.addEventListener('click', () => {
      this.showPaletteGrid(root);
    });

    headingFont.addEventListener('change', () => {
      this.brand.fonts.heading = headingFont.value;
    });
    bodyFont.addEventListener('change', () => {
      this.brand.fonts.body = bodyFont.value;
    });
    scaleSelect.addEventListener('change', () => {
      this.scale = parseInt(scaleSelect.value);
    });

    this.loadSavedKits(savedKitSelect);
    savedKitSelect.addEventListener('change', async () => {
      if (!savedKitSelect.value) return;
      const items = await db.getSavedItems('brand-kit');
      const item = items.find((i) => String(i.id) === savedKitSelect.value);
      if (!item) return;
      const data = item.data as BrandData;
      this.brand = { ...this.brand, ...data };
      nameInput.value = this.brand.name;
      taglineInput.value = this.brand.tagline;
      headingFont.value = this.brand.fonts.heading;
      bodyFont.value = this.brand.fonts.body;
      renderColors();
      if (this.brand.logoDataUrl) {
        logoPreview.innerHTML = `<img src="${this.brand.logoDataUrl}" style="max-width:100%;max-height:60px;">`;
        this.loadLogoImage();
      }
      Toast.success('Brand kit loaded');
    });

    root.querySelector('#bgl-preview-btn')!.addEventListener('click', () => {
      this.renderBoard(ctx);
    });
    root.querySelector('#bgl-export-png')!.addEventListener('click', () => {
      this.exportPng(canvas);
    });
    root.querySelector('#bgl-export-pdf')!.addEventListener('click', () => {
      this.exportPdf(canvas);
    });
    root.querySelector('#bgl-save')!.addEventListener('click', async () => {
      await db.saveItem('brand-kit', this.brand.name || 'Untitled', this.brand);
      Toast.success('Brand kit saved');
      logToolAction('brand-guidelines', 'Saved brand kit');
    });
    root.querySelector('#bgl-export-css')!.addEventListener('click', () => {
      this.exportCss();
    });

    renderColors();
    this.loadLogoImage();
    this.renderBoard(ctx);

    // Check for logo transferred from Logo Builder
    const transferredLogo = localStorage.getItem('lb-logo-transfer');
    if (transferredLogo) {
      localStorage.removeItem('lb-logo-transfer');
      this.brand.logoDataUrl = transferredLogo;
      logoPreview.innerHTML = `<img src="${transferredLogo}" style="max-width:100%;max-height:60px;">`;
      this.loadLogoImage();
      setTimeout(() => this.renderBoard(ctx), 200);
    }
  }

  private async loadSavedKits(select: HTMLSelectElement): Promise<void> {
    const items = await db.getSavedItems('brand-kit');
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = String(item.id);
      opt.textContent = item.name;
      select.appendChild(opt);
    });
  }

  private loadLogoImage(): void {
    if (!this.brand.logoDataUrl) {
      this.logoImg = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.logoImg = img;
    };
    img.src = this.brand.logoDataUrl;
  }

  private async renderBoard(ctx: CanvasRenderingContext2D): Promise<void> {
    await this.ensureFonts();

    const accent = this.brand.colors[1] || BOARD.accent;

    ctx.fillStyle = BOARD.bg;
    ctx.fillRect(0, 0, BOARD.width, BOARD.height);

    this.drawLogoCover(ctx, panelAt(0, 0), accent);
    this.drawColorSystem(ctx, panelAt(0, 1));
    this.drawTypography(ctx, panelAt(0, 2), accent);
    this.drawConstruction(ctx, panelAt(1, 0), accent);
    this.drawDigitalApp(ctx, panelAt(1, 1), accent);
    this.drawBrandEssence(ctx, panelAt(1, 2), accent);
    this.drawDosDonts(ctx, panelAt(2, 0), accent);
    this.drawSpacingTokens(ctx, panelAt(2, 1), accent);
    this.drawApplications(ctx, panelAt(2, 2), accent);
  }

  private drawLogoCover(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[0], 1);
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2 - 20;

    if (this.logoImg) {
      const maxH = 120;
      const s = Math.min(maxH / this.logoImg.width, maxH / this.logoImg.height);
      const w = this.logoImg.width * s;
      const h = this.logoImg.height * s;
      ctx.drawImage(this.logoImg, cx - w / 2, cy - h / 2 - 30, w, h);
    } else {
      drawLogoPlaceholder(ctx, cx, cy - 30, 80, accent);
    }

    ctx.font = `bold 36px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.brand.name || 'BRAND NAME', cx, cy + 60);

    if (this.brand.tagline) {
      ctx.font = `14px ${this.brand.fonts.body}`;
      ctx.fillStyle = BOARD.textSecondary;
      ctx.fillText(this.brand.tagline, cx, cy + 105);
    }

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 135);
    ctx.lineTo(cx + 40, cy + 135);
    ctx.stroke();
  }

  private drawColorSystem(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[1], 2);
    const colors = this.brand.colors;
    const swatchSize = Math.min(80, (p.w - 60 - (colors.length - 1) * 12) / colors.length);
    const totalW = colors.length * swatchSize + (colors.length - 1) * 12;
    const startX = p.x + (p.w - totalW) / 2;
    drawSwatchRow(ctx, colors, startX, p.y + 60, swatchSize, 12);

    colors.forEach((c, i) => {
      const sx = startX + i * (swatchSize + 12);
      const label = i === 0 ? 'Primary' : i === 1 ? 'Accent' : `Color ${i + 1}`;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = BOARD.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, sx + swatchSize / 2, p.y + 60 + swatchSize + 22);
    });

    const bg = colors[0] || '#000000';
    const fg = colors.length > 2 ? colors[2] : '#ffffff';
    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= 4.5;

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText(`Contrast: ${ratio.toFixed(1)}:1`, p.x + 30, p.y + p.h - 70);
    ctx.fillStyle = pass ? '#22c55e' : '#ef4444';
    ctx.fillText(pass ? 'WCAG AA pass' : 'WCAG AA fail', p.x + 30, p.y + p.h - 50);

    const blockY = p.y + 220;
    colors.slice(0, 3).forEach((c, i) => {
      const bx = p.x + 30 + i * 180;
      ctx.fillStyle = c;
      roundRect(ctx, bx, blockY, 160, 80, 6);
      ctx.fill();
      const textLum = (parseInt(c.slice(1), 16) >> 16) & 255;
      ctx.fillStyle = textLum > 128 ? '#000000' : '#ffffff';
      ctx.font = `bold 14px ${this.brand.fonts.heading}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Aa', bx + 80, blockY + 40);
    });
  }

  private drawTypography(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    void accent;
    drawPanelBase(ctx, p, PANEL_LABELS[2], 3);
    const left = p.x + 30;

    ctx.font = `bold 42px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Heading', left, p.y + 55);

    ctx.font = `14px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.fillText(this.brand.fonts.heading.split(',')[0], left, p.y + 105);

    ctx.strokeStyle = BOARD.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, p.y + 130);
    ctx.lineTo(p.x + p.w - 30, p.y + 130);
    ctx.stroke();

    ctx.font = `28px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.fillText('Subheading', left, p.y + 145);

    ctx.font = `14px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.fillText(this.brand.fonts.body.split(',')[0], left, p.y + 185);

    ctx.strokeStyle = BOARD.panelBorder;
    ctx.beginPath();
    ctx.moveTo(left, p.y + 210);
    ctx.lineTo(p.x + p.w - 30, p.y + 210);
    ctx.stroke();

    ctx.font = `15px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    const sample =
      'The quick brown fox jumps over the lazy dog. Good typography creates visual hierarchy and improves readability across all brand touchpoints.';
    this.wrapText(ctx, sample, left, p.y + 225, p.w - 60, 22);

    const sizes = [48, 36, 24, 18, 14, 12];
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textMuted;
    ctx.textAlign = 'right';
    sizes.forEach((s, i) => {
      ctx.fillText(`${s}px`, p.x + p.w - 30, p.y + 310 + i * 20);
    });
    ctx.textAlign = 'left';
    sizes.forEach((s, i) => {
      ctx.font = `${Math.min(s, 20)}px ${this.brand.fonts.heading}`;
      ctx.fillStyle = BOARD.textPrimary;
      ctx.fillText('Aa', p.x + 30, p.y + 305 + i * 20);
    });
  }

  private drawConstruction(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[3], 4);
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2 + 10;
    const size = 200;

    drawConstructionGrid(ctx, cx - size / 2, cy - size / 2, size, 8);

    if (this.logoImg) {
      ctx.globalAlpha = 0.7;
      const s = Math.min(size / this.logoImg.width, size / this.logoImg.height) * 0.8;
      const w = this.logoImg.width * s;
      const h = this.logoImg.height * s;
      ctx.drawImage(this.logoImg, cx - w / 2, cy - h / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      drawLogoPlaceholder(ctx, cx, cy, size * 0.6, accent);
    }

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${size}px`, cx, cy + size / 2 + 10);

    ctx.save();
    ctx.translate(cx - size / 2 - 10, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${size}px`, 0, 0);
    ctx.restore();

    ctx.strokeStyle = accent + '60';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const cs = size * 0.15;
    ctx.strokeRect(cx - size / 2 - cs, cy - size / 2 - cs, size + cs * 2, size + cs * 2);
    ctx.setLineDash([]);
  }

  private drawDigitalApp(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[4], 5);
    const mx = p.x + 40;
    const my = p.y + 55;
    const mw = p.w - 80;
    const mh = p.h - 90;

    drawBrowserMockup(ctx, mx, my, mw, mh, accent);

    const contentY = my + 45;
    ctx.font = `bold 20px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.brand.name || 'Brand', mx + mw / 2, contentY + 20);

    if (this.brand.tagline) {
      ctx.font = `12px ${this.brand.fonts.body}`;
      ctx.fillStyle = BOARD.textSecondary;
      ctx.fillText(this.brand.tagline, mx + mw / 2, contentY + 50);
    }

    ctx.font = `11px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textMuted;
    const navItems = ['Home', 'About', 'Products', 'Contact'];
    const navW = navItems.length * 70;
    const navStart = mx + (mw - navW) / 2;
    navItems.forEach((item, i) => {
      ctx.fillText(item, navStart + i * 70 + 35, contentY + 80);
    });

    const btnW = 120;
    const btnH = 32;
    const btnX = mx + (mw - btnW) / 2;
    ctx.fillStyle = accent;
    roundRect(ctx, btnX, contentY + 110, btnW, btnH, 16);
    ctx.fill();
    ctx.font = `bold 11px ${this.brand.fonts.body}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Get Started', btnX + btnW / 2, contentY + 110 + btnH / 2);
  }

  private drawBrandEssence(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[5], 6);
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('BRAND ESSENCE', cx, cy - 30);

    const tagline = this.brand.tagline || 'Define your brand purpose';
    ctx.font = `italic 28px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.fillText(`"${tagline}"`, cx, cy + 20);

    ctx.font = `12px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textMuted;
    ctx.fillText(this.brand.name || 'BRAND', cx, cy + 55);

    ctx.strokeStyle = accent + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 75);
    ctx.lineTo(cx + 100, cy + 75);
    ctx.stroke();
  }

  private drawDosDonts(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    void accent;
    drawPanelBase(ctx, p, PANEL_LABELS[6], 7);
    const halfW = (p.w - 60) / 2;
    const leftX = p.x + 30;
    const rightX = p.x + 30 + halfW + 20;
    const cardY = p.y + 50;
    const cardH = p.h - 80;

    drawCard(ctx, leftX, cardY, halfW, cardH, '#0f1f0f', '#22c55e30');
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('DO', leftX + halfW / 2, cardY + 15);

    const doRules = [
      'Use logo with clear space',
      'Use approved color combos',
      'Maintain aspect ratio',
      'Use on dark or light bg',
    ];
    ctx.font = `12px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'left';
    doRules.forEach((rule, i) => {
      drawCheckCross(ctx, leftX + 20, cardY + 55 + i * 35, 8, true);
      ctx.fillText(rule, leftX + 38, cardY + 49 + i * 35);
    });

    drawCard(ctx, rightX, cardY, halfW, cardH, '#1f0f0f', '#ef444430');
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("DON'T", rightX + halfW / 2, cardY + 15);

    const dontRules = [
      'Stretch or distort logo',
      'Use unapproved colors',
      'Place on busy backgrounds',
      'Change font pairing',
    ];
    ctx.font = `12px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'left';
    dontRules.forEach((rule, i) => {
      drawCheckCross(ctx, rightX + 20, cardY + 55 + i * 35, 8, false);
      ctx.fillText(rule, rightX + 38, cardY + 49 + i * 35);
    });
  }

  private drawSpacingTokens(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[7], 8);
    const left = p.x + 30;
    const top = p.y + 55;

    const spacings = [4, 8, 12, 16, 24, 32, 48, 64];
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    spacings.forEach((s, i) => {
      const y = top + i * 28;
      ctx.fillStyle = BOARD.textMuted;
      ctx.textAlign = 'right';
      ctx.fillText(`${s}px`, left + 35, y + 6);
      ctx.fillStyle = accent + '40';
      ctx.fillRect(left + 45, y, s * 2.5, 12);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(left + 45, y, s * 2.5, 12);
    });

    const radii = [4, 8, 12, 16, 24];
    const radiusY = top + spacings.length * 28 + 20;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText('Border Radius', left, radiusY);

    radii.forEach((r, i) => {
      const x = left + i * 90;
      const y = radiusY + 25;
      ctx.fillStyle = accent + '30';
      roundRect(ctx, x, y, 70, 40, r);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, 70, 40, r);
      ctx.stroke();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = BOARD.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(`${r}px`, x + 35, y + 55);
    });

    const shadowY = radiusY + 100;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText('Elevation', left, shadowY);

    const shadows = [
      { label: 'sm', blur: 4, yOff: 0 },
      { label: 'md', blur: 8, yOff: 1 },
      { label: 'lg', blur: 16, yOff: 2 },
      { label: 'xl', blur: 32, yOff: 3 },
    ];
    shadows.forEach((s, i) => {
      const x = left + i * 120;
      const y = shadowY + 25;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = s.blur;
      ctx.shadowOffsetY = s.yOff * 2;
      ctx.fillStyle = BOARD.panelBg;
      roundRect(ctx, x, y, 100, 50, 8);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = BOARD.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, x + 50, y + 65);
    });
  }

  private drawApplications(
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; w: number; h: number },
    accent: string,
  ): void {
    drawPanelBase(ctx, p, PANEL_LABELS[8], 9);

    const cardW = 240;
    const cardH = 140;
    const cardX = p.x + (p.w - cardW) / 2;
    const cardY = p.y + 55;
    ctx.fillStyle = this.brand.colors[0] || '#1a1a1a';
    roundRect(ctx, cardX, cardY, cardW, cardH, 6);
    ctx.fill();
    ctx.strokeStyle = BOARD.panelBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, cardY, cardW, cardH, 6);
    ctx.stroke();

    if (this.logoImg) {
      const s = Math.min(40 / this.logoImg.width, 40 / this.logoImg.height);
      ctx.drawImage(
        this.logoImg,
        cardX + 15,
        cardY + 15,
        this.logoImg.width * s,
        this.logoImg.height * s,
      );
    } else {
      drawLogoPlaceholder(ctx, cardX + 35, cardY + 35, 30, accent);
    }

    ctx.font = `bold 14px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.brand.name || 'Brand', cardX + 15, cardY + 65);

    ctx.font = `10px ${this.brand.fonts.body}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.fillText('hello@brand.com', cardX + 15, cardY + 85);
    ctx.fillText('brand.dev', cardX + 15, cardY + 100);

    const iconSize = 64;
    const iconX = p.x + 30;
    const iconY = cardY + cardH + 30;

    ctx.fillStyle = accent;
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 14);
    ctx.fill();
    if (this.logoImg) {
      const s = Math.min(
        (iconSize - 16) / this.logoImg.width,
        (iconSize - 16) / this.logoImg.height,
      );
      const w = this.logoImg.width * s;
      const h = this.logoImg.height * s;
      ctx.drawImage(this.logoImg, iconX + (iconSize - w) / 2, iconY + (iconSize - h) / 2, w, h);
    } else {
      ctx.font = `bold 24px ${this.brand.fonts.heading}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        (this.brand.name || 'B')[0].toUpperCase(),
        iconX + iconSize / 2,
        iconY + iconSize / 2,
      );
    }

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textMuted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('App Icon', iconX + iconSize + 15, iconY + 10);
    ctx.fillText('64 x 64', iconX + iconSize + 15, iconY + 25);

    const badgeX = iconX + iconSize + 100;
    ctx.fillStyle = accent;
    roundRect(ctx, badgeX, iconY, 100, 28, 14);
    ctx.fill();
    ctx.font = `bold 10px ${this.brand.fonts.body}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.brand.name || 'BRAND', badgeX + 50, iconY + 14);

    const stripY = iconY + iconSize + 25;
    ctx.strokeStyle = accent + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + 30, stripY);
    ctx.lineTo(p.x + p.w - 30, stripY);
    ctx.stroke();

    ctx.font = `bold 11px ${this.brand.fonts.heading}`;
    ctx.fillStyle = BOARD.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Brand Touchpoints', p.x + p.w / 2, stripY + 10);

    const miniY = stripY + 35;
    const items = ['Letterhead', 'Envelope', 'Badge'];
    items.forEach((item, i) => {
      const mx = p.x + 50 + i * 180;
      ctx.fillStyle = BOARD.panelBg;
      roundRect(ctx, mx, miniY, 140, 80, 4);
      ctx.fill();
      ctx.strokeStyle = BOARD.panelBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, mx, miniY, 140, 80, 4);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillRect(mx + 10, miniY + 10, 40, 3);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = BOARD.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(item, mx + 70, miniY + 60);
    });
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxW: number,
    lineH: number,
  ): void {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, cy);
  }

  private async ensureFonts(): Promise<void> {
    const fonts = [this.brand.fonts.heading, this.brand.fonts.body];
    const promises = fonts.map((f) => {
      const family = f.split(',')[0].replace(/'/g, '').trim();
      return Promise.all([
        document.fonts.load(`400 16px ${family}`),
        document.fonts.load(`700 16px ${family}`),
      ]);
    });
    await Promise.all(promises);
  }

  private exportPng(canvas: HTMLCanvasElement): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = BOARD.width * this.scale;
    exportCanvas.height = BOARD.height * this.scale;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] brand-guidelines-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(`PNG downloaded (${exportCanvas.width}x${exportCanvas.height})`);
      logToolAction('brand-guidelines', 'Exported brand guidelines PNG');
    }, 'image/png');
  }

  private async exportPdf(canvas: HTMLCanvasElement): Promise<void> {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = BOARD.width * this.scale;
      exportCanvas.height = BOARD.height * this.scale;
      const ctx = exportCanvas.getContext('2d')!;
      ctx.scale(this.scale, this.scale);
      ctx.drawImage(canvas, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        exportCanvas.toBlob((b) => resolve(b!), 'image/png');
      });
      const bytes = await blob.arrayBuffer();
      const pngImage = await pdf.embedPng(bytes);

      const page = pdf.addPage([exportCanvas.width, exportCanvas.height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: exportCanvas.width,
        height: exportCanvas.height,
      });

      const pdfBytes = await pdf.save();
      const pdfBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] brand-guidelines-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('PDF downloaded');
      logToolAction('brand-guidelines', 'Exported brand guidelines PDF');
    } catch {
      Toast.error('PDF export failed');
    }
  }

  private exportCss(): void {
    const css = [
      `:root {`,
      `  /* Brand Colors */`,
      ...this.brand.colors.map((c, i) => `  --brand-color-${i + 1}: ${c};`),
      `  /* Brand Fonts */`,
      `  --font-heading: ${this.brand.fonts.heading};`,
      `  --font-body: ${this.brand.fonts.body};`,
      `}`,
      '',
      `/* Google Fonts */`,
      `@import url('https://fonts.googleapis.com/css2?family=${this.brand.fonts.heading.split(',')[0].replace(/ /g, '+')}:wght@400;700&family=${this.brand.fonts.body.split(',')[0].replace(/ /g, '+')}:wght@400;600&display=swap');`,
    ].join('\n');
    void copyToClipboard(css);
    Toast.copied('CSS variables');
    logToolAction('brand-guidelines', 'Exported brand kit CSS');
  }

  private randomizeColors(): void {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 40);
    const primary = hslToHex(h, s, 45);
    const accent = hslToHex((h + 30 + Math.floor(Math.random() * 30)) % 360, s + 10, 55);
    const neutral = hslToHex(h, 8, 12);
    const light = hslToHex(h, 15, 95);
    this.brand.colors = [neutral, primary, accent, light];
  }

  private showPaletteGrid(root: HTMLElement): void {
    const section = root.querySelector('#bgl-palette-section') as HTMLElement;
    const grid = root.querySelector('#bgl-palette-grid')!;
    section.style.display = '';

    const base = this.brand.colors[1] || this.brand.colors[0] || '#c9a96e';
    const palettes = this.generateColorhuntPalettes(base);

    grid.innerHTML = palettes
      .map(
        (p) => `
      <div class="bgl-palette-card" data-colors='${JSON.stringify(p.colors)}'>
        <div class="bgl-palette-strip">
          ${p.colors.map((c) => `<div class="bgl-palette-cell" style="background:${c}"></div>`).join('')}
        </div>
        <span class="bgl-palette-label">${p.name}</span>
      </div>
    `,
      )
      .join('');

    grid.querySelectorAll('.bgl-palette-card').forEach((card) => {
      card.addEventListener('click', () => {
        const colors = JSON.parse((card as HTMLElement).dataset.colors!);
        this.brand.colors = colors;
        this.renderColorInputs(root);
        Toast.success('Palette applied');
      });
    });
  }

  private renderColorInputs(root: HTMLElement): void {
    const colorsEl = root.querySelector('#bgl-colors')!;
    colorsEl.innerHTML = this.brand.colors
      .map(
        (c, i) => `
      <div class="bgl-color-item">
        <input type="color" value="${c}" class="bgl-color-input" data-i="${i}">
        <span class="bgl-color-hex">${c}</span>
        ${this.brand.colors.length > 1 ? `<button class="btn btn--ghost btn--sm bgl-color-remove" data-i="${i}">×</button>` : ''}
      </div>
    `,
      )
      .join('');
    colorsEl.querySelectorAll('.bgl-color-input').forEach((el) => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.brand.colors[i] = (e.target as HTMLInputElement).value;
        (e.target as HTMLElement)
          .closest('.bgl-color-item')!
          .querySelector('.bgl-color-hex')!.textContent = this.brand.colors[i];
      });
    });
    colorsEl.querySelectorAll('.bgl-color-remove').forEach((el) => {
      el.addEventListener('click', (e) => {
        this.brand.colors.splice(parseInt((e.target as HTMLElement).dataset.i!), 1);
        this.renderColorInputs(root);
      });
    });
  }

  private generateColorhuntPalettes(base: string): Array<{ name: string; colors: string[] }> {
    const [h, s, l] = hexToHsl(base);
    const palettes: Array<{ name: string; colors: string[] }> = [];

    // Analogous warm
    palettes.push({
      name: 'Analogous',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 25) % 360, s - 5, l + 10),
        hslToHex((h + 50) % 360, s - 10, l + 20),
        hslToHex((h + 75) % 360, s - 15, l + 30),
      ],
    });

    // Complementary contrast
    palettes.push({
      name: 'Complementary',
      colors: [
        hslToHex(h, s, l),
        hslToHex(h, s - 20, l + 25),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 180) % 360, s - 20, l + 25),
      ],
    });

    // Monochromatic
    palettes.push({
      name: 'Monochrome',
      colors: [hslToHex(h, s, 20), hslToHex(h, s, 40), hslToHex(h, s, 60), hslToHex(h, s, 80)],
    });

    // Earth tones
    palettes.push({
      name: 'Earth',
      colors: [
        hslToHex(30, 35, 30),
        hslToHex(35, 45, 50),
        hslToHex(40, 30, 70),
        hslToHex(20, 25, 85),
      ],
    });

    // Pastel
    palettes.push({
      name: 'Pastel',
      colors: [
        hslToHex(h, 50, 80),
        hslToHex((h + 60) % 360, 45, 82),
        hslToHex((h + 120) % 360, 40, 84),
        hslToHex((h + 180) % 360, 35, 86),
      ],
    });

    // Dark moody
    palettes.push({
      name: 'Moody',
      colors: [
        hslToHex(h, 30, 15),
        hslToHex(h, 25, 25),
        hslToHex((h + 20) % 360, 35, 35),
        hslToHex((h + 40) % 360, 20, 50),
      ],
    });

    // Vibrant
    palettes.push({
      name: 'Vibrant',
      colors: [
        hslToHex(h, 80, 55),
        hslToHex((h + 90) % 360, 75, 55),
        hslToHex((h + 180) % 360, 70, 50),
        hslToHex((h + 270) % 360, 65, 55),
      ],
    });

    // Neutral warm
    palettes.push({
      name: 'Warm Neutral',
      colors: [
        hslToHex(20, 15, 25),
        hslToHex(25, 20, 45),
        hslToHex(30, 15, 65),
        hslToHex(35, 10, 85),
      ],
    });

    // Cool slate
    palettes.push({
      name: 'Cool Slate',
      colors: [
        hslToHex(210, 20, 20),
        hslToHex(210, 15, 40),
        hslToHex(210, 10, 60),
        hslToHex(210, 8, 80),
      ],
    });

    // Sunset
    palettes.push({
      name: 'Sunset',
      colors: [
        hslToHex(350, 70, 50),
        hslToHex(20, 80, 55),
        hslToHex(35, 75, 55),
        hslToHex(50, 60, 60),
      ],
    });

    // Triadic bold
    const [tri1, tri2, tri3] = generateHarmony(base, 'triadic');
    palettes.push({
      name: 'Triadic',
      colors: [tri1, tri2, tri3, hslToHex(h, 10, 90)],
    });

    // Split complementary
    const [sp1, sp2, sp3] = generateHarmony(base, 'split');
    palettes.push({
      name: 'Split',
      colors: [sp1, sp2, sp3, hslToHex(h, 5, 92)],
    });

    return palettes;
  }

  destroy(): void {}
}
