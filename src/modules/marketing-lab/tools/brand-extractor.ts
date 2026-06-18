import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';

interface BrandResult {
  name: string;
  description: string;
  logo: string;
  favicon: string;
  colors: string[];
  fonts: string[];
  ogImage: string;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const COLOR_RE = /#([0-9a-f]{3,8})\b/gi;
const RGB_RE = /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/gi;
const HSL_RE = /hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%/gi;
const FONT_RE = /font-family\s*:\s*([^;}{]+)/gi;
const FONT_FACE_RE = /@font-face\s*\{[^}]*font-family\s*:\s*['"]*([^'";}]+)['"]*[^}]*\}/gi;

export class BrandExtractor {
  id = 'brand-extractor';
  name = 'Brand Kit Extractor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8"/>
      <path d="M12 8v8"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    </svg>`;

  private urlInput!: HTMLInputElement;
  private extractBtn!: HTMLButtonElement;
  private resultEl!: HTMLDivElement;
  private loadingEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="mlbe-url-row">
          <div class="form-group" style="flex:1;">
            <label class="label">Website URL</label>
            <input type="url" class="input" id="mlbe-url" placeholder="https://example.com">
          </div>
          <button class="btn btn--primary" id="mlbe-extract" style="align-self:flex-end;">Extract</button>
        </div>
        <div class="mlbe-loading" id="mlbe-loading" style="display:none;">
          <div class="mlbe-spinner"></div>
          <span>Fetching and analyzing page...</span>
        </div>
        <div class="mlbe-result" id="mlbe-result"></div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.urlInput = root.querySelector('#mlbe-url')!;
    this.extractBtn = root.querySelector('#mlbe-extract')!;
    this.loadingEl = root.querySelector('#mlbe-loading')!;
    this.resultEl = root.querySelector('#mlbe-result')!;

    this.extractBtn.addEventListener('click', () => this.extract());
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.extract();
    });
  }

  private async extract(): Promise<void> {
    const url = this.urlInput.value.trim();
    if (!url) { Toast.error('Enter a URL first'); return; }

    let normalized = url;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;

    this.extractBtn.disabled = true;
    this.extractBtn.textContent = 'Extracting...';
    this.loadingEl.style.display = '';
    this.resultEl.innerHTML = '';

    try {
      const resp = await fetch(CORS_PROXY + encodeURIComponent(normalized));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      const brand = this.parseBrand(html, normalized);
      this.renderResult(brand);
      logToolAction('brand-extractor', `Extracted brand from ${new URL(normalized).hostname}`);
      Toast.success('Brand kit extracted');
    } catch (e) {
      console.warn('Brand extraction failed:', e);
      Toast.error('Failed to fetch URL. Try another URL.');
    }

    this.extractBtn.disabled = false;
    this.extractBtn.textContent = 'Extract';
    this.loadingEl.style.display = 'none';
  }

  private parseBrand(html: string, url: string): BrandResult {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const origin = new URL(url).origin;

    const meta = (name: string): string => {
      const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      return el?.getAttribute('content') || '';
    };

    // Brand name
    const ogSiteName = meta('og:site_name');
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
    const name = ogSiteName || title.split(/[|–—-]/)[0].trim() || h1;

    // Description
    const description = meta('og:description') || meta('description') || '';

    // Favicon
    let favicon = '';
    const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconEl) {
      const href = faviconEl.getAttribute('href') || '';
      favicon = this.resolveUrl(href, origin);
    }
    if (!favicon) favicon = origin + '/favicon.ico';

    // Logo & OG Image
    const ogImage = this.resolveUrl(meta('og:image'), origin);
    const logo = this.findLogo(doc, origin) || ogImage;

    // Colors
    const colors = this.extractColors(doc, html);

    // Fonts
    const fonts = this.extractFonts(html);

    return { name, description, logo, favicon, colors, fonts, ogImage };
  }

  private findLogo(doc: Document, origin: string): string {
    // Images with "logo" in class, alt, id, or src
    const candidates = doc.querySelectorAll('img[class*="logo" i], img[alt*="logo" i], img[id*="logo" i], img[src*="logo" i]');
    for (const img of candidates) {
      const src = img.getAttribute('src') || '';
      if (src) return this.resolveUrl(src, origin);
    }
    // SVG logos
    const svgLogo = doc.querySelector('svg[class*="logo" i], svg[id*="logo" i]');
    if (svgLogo) {
      // Return inline SVG as data URI (simplified)
      const svgHtml = svgLogo.outerHTML;
      if (svgHtml.length < 5000) {
        return 'data:image/svg+xml;base64,' + btoa(svgHtml);
      }
    }
    return '';
  }

  private extractColors(doc: Document, html: string): string[] {
    const raw = new Set<string>();

    // meta theme-color
    const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content');
    if (themeColor) raw.add(themeColor.toLowerCase());

    // CSS custom properties in style tags
    for (const style of doc.querySelectorAll('style')) {
      const text = style.textContent || '';
      const varMatches = text.matchAll(/--[\w-]+\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/gi);
      for (const m of varMatches) raw.add(m[1].toLowerCase());
    }

    // All color matches in HTML
    for (const m of html.matchAll(COLOR_RE)) {
      const hex = '#' + m[1].toLowerCase();
      if (this.isValidColor(hex)) raw.add(hex);
    }
    for (const m of html.matchAll(RGB_RE)) raw.add(m[0].toLowerCase());
    for (const m of html.matchAll(HSL_RE)) raw.add(m[0].toLowerCase());

    // Filter and dedupe
    const colors: string[] = [];
    for (const c of raw) {
      const normalized = this.normalizeColor(c);
      if (normalized && !this.isCommonColor(normalized) && colors.length < 24) {
        colors.push(normalized);
      }
    }

    // Sort by hue for nice display
    return colors.sort((a, b) => {
      const ha = this.hexToHsl(a)[0];
      const hb = this.hexToHsl(b)[0];
      return ha - hb;
    });
  }

  private extractFonts(html: string): string[] {
    const fonts = new Set<string>();

    // @font-face declarations
    for (const m of html.matchAll(FONT_FACE_RE)) {
      const family = m[1].trim().replace(/['"]/g, '');
      if (family && family !== 'inherit' && family !== 'initial') fonts.add(family);
    }

    // font-family declarations (limit to first 50 matches for perf)
    let count = 0;
    for (const m of html.matchAll(FONT_RE)) {
      if (++count > 50) break;
      const families = m[1].split(',');
      for (const f of families) {
        const clean = f.trim().replace(/['"]/g, '').split(/\s+/)[0];
        if (clean && clean !== 'inherit' && clean !== 'initial' && clean !== 'var' && clean.length > 1) {
          fonts.add(clean);
        }
      }
    }

    // Filter generic families
    const generic = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace']);
    return [...fonts].filter(f => !generic.has(f.toLowerCase())).slice(0, 12);
  }

  private resolveUrl(href: string, origin: string): string {
    if (!href) return '';
    if (href.startsWith('data:')) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) return origin + href;
    if (href.startsWith('http')) return href;
    return origin + '/' + href;
  }

  private isValidColor(hex: string): boolean {
    const h = hex.replace('#', '');
    return h.length === 3 || h.length === 4 || h.length === 6 || h.length === 8;
  }

  private normalizeColor(c: string): string {
    if (c.startsWith('#')) {
      let h = c.slice(1);
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length === 4) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length >= 6) return '#' + h.slice(0, 6).toLowerCase();
    }
    return c.toLowerCase();
  }

  private isCommonColor(c: string): boolean {
    const common = ['#000000', '#000', '#ffffff', '#fff', '#fff', '#00000000', '#ffffff00'];
    return common.includes(c.toLowerCase()) || c === 'transparent' || c === 'inherit';
  }

  private hexToHsl(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h2 = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h2 = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h2 = ((b - r) / d + 2) / 6;
      else h2 = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h2 * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  private renderResult(b: BrandResult): void {
    const colorSwatches = b.colors.length > 0
      ? b.colors.map(c => `
        <div class="mlc-swatch" style="background:${c}" data-color="${c}" title="Click to copy ${c}">
          <span class="mlc-swatch__label">${c}</span>
        </div>
      `).join('')
      : '<span class="mlbe-empty">No colors detected</span>';

    const fontList = b.fonts.length > 0
      ? b.fonts.map(f => `<span class="mlbe-font" data-font="${f}" title="Click to copy">${f}</span>`).join('')
      : '<span class="mlbe-empty">No fonts detected</span>';

    const logoHtml = b.logo
      ? `<img src="${b.logo}" class="mlbe-logo-img" alt="Logo" onerror="this.style.display='none'">`
      : '<span class="mlbe-empty">No logo found</span>';

    const faviconHtml = b.favicon
      ? `<img src="${b.favicon}" class="mlbe-favicon-img" alt="Favicon" onerror="this.style.display='none'">`
      : '';

    this.resultEl.innerHTML = `
      <div class="mlbe-card">
        <div class="mlbe-card__header">
          ${faviconHtml}
          <div class="mlbe-card__title">${b.name || 'Unknown Brand'}</div>
        </div>
        ${b.description ? `<p class="mlbe-card__desc">${b.description}</p>` : ''}

        <div class="mlbe-section">
          <div class="mlbe-section__title">Logo</div>
          <div class="mlbe-logo">${logoHtml}</div>
        </div>

        <div class="mlbe-section">
          <div class="mlbe-section__title">Colors <span class="mlbe-count">${b.colors.length}</span></div>
          <div class="mlbe-colors">${colorSwatches}</div>
        </div>

        <div class="mlbe-section">
          <div class="mlbe-section__title">Fonts <span class="mlbe-count">${b.fonts.length}</span></div>
          <div class="mlbe-fonts">${fontList}</div>
        </div>

        ${b.ogImage ? `
        <div class="mlbe-section">
          <div class="mlbe-section__title">OG Image</div>
          <img src="${b.ogImage}" class="mlbe-og-img" alt="OG Image" onerror="this.style.display='none'">
        </div>` : ''}

        <div class="tool-actions">
          <button class="btn btn--ghost" id="mlbe-copy-css">Copy CSS Variables</button>
          <button class="btn btn--ghost" id="mlbe-copy-json">Copy JSON</button>
        </div>
      </div>
    `;

    // Color click to copy
    this.resultEl.querySelectorAll('.mlc-swatch').forEach(el => {
      el.addEventListener('click', () => {
        navigator.clipboard.writeText((el as HTMLElement).dataset.color!);
        Toast.copied('Color');
      });
    });

    // Font click to copy
    this.resultEl.querySelectorAll('.mlbe-font').forEach(el => {
      el.addEventListener('click', () => {
        navigator.clipboard.writeText((el as HTMLElement).dataset.font!);
        Toast.copied('Font');
      });
    });

    // Copy CSS variables
    this.resultEl.querySelector('#mlbe-copy-css')?.addEventListener('click', () => {
      let css = ':root {\n';
      b.colors.forEach((c, i) => { css += `  --brand-color-${i + 1}: ${c};\n`; });
      b.fonts.forEach((f, i) => { css += `  --brand-font-${i + 1}: '${f}';\n`; });
      css += '}';
      navigator.clipboard.writeText(css);
      Toast.copied('CSS Variables');
      logToolAction('brand-extractor', 'Copied brand CSS variables');
    });

    // Copy JSON
    this.resultEl.querySelector('#mlbe-copy-json')?.addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(b, null, 2));
      Toast.copied('JSON');
      logToolAction('brand-extractor', 'Copied brand JSON');
    });
  }

  destroy(): void {}
}
