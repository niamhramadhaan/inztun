import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { copyToClipboard } from '../../../utils/image';

export class OgPreview {
  id = 'og-preview';
  name = 'Open Graph Preview';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`;
  badge = 'Social';

  private titleInput!: HTMLInputElement;
  private descInput!: HTMLTextAreaElement;
  private urlInput!: HTMLInputElement;
  private imageInput!: HTMLInputElement;
  private outputEl!: HTMLPreElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Page Title</label>
          <input type="text" class="input" id="og-title" placeholder="My Amazing Page" maxlength="95">
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="input input--textarea" id="og-desc" placeholder="A compelling description of your page..." rows="2" maxlength="200"></textarea>
        </div>
        <div class="ogp-fields">
          <div class="form-group"><label class="label">Page URL</label><input type="url" class="input" id="og-url" placeholder="https://example.com/page"></div>
          <div class="form-group"><label class="label">Image URL</label><input type="url" class="input" id="og-image" placeholder="https://example.com/image.jpg"></div>
        </div>
        <label class="label" style="margin-top:var(--space-4);">Preview</label>
        <div class="ogp-previews">
          <div class="ogp-card ogp-card--twitter" id="og-twitter">
            <div class="ogp-card__image" id="og-twitter-img"></div>
            <div class="ogp-card__body">
              <div class="ogp-card__site">example.com</div>
              <div class="ogp-card__title">Page Title</div>
              <div class="ogp-card__desc">Description will appear here...</div>
            </div>
          </div>
          <div class="ogp-card ogp-card--facebook" id="og-facebook">
            <div class="ogp-card__image" id="og-fb-img"></div>
            <div class="ogp-card__body">
              <div class="ogp-card__site">EXAMPLE.COM</div>
              <div class="ogp-card__title">Page Title</div>
              <div class="ogp-card__desc">Description will appear here...</div>
            </div>
          </div>
          <div class="ogp-card ogp-card--linkedin" id="og-linkedin">
            <div class="ogp-card__image" id="og-li-img"></div>
            <div class="ogp-card__body">
              <div class="ogp-card__title">Page Title</div>
              <div class="ogp-card__site">example.com</div>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="og-copy">Copy Meta Tags</button>
        </div>
        <pre class="input input--textarea" id="og-output" style="min-height:100px;cursor:text;font-size:var(--text-xs);"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.titleInput = root.querySelector('#og-title')!;
    this.descInput = root.querySelector('#og-desc')!;
    this.urlInput = root.querySelector('#og-url')!;
    this.imageInput = root.querySelector('#og-image')!;
    this.outputEl = root.querySelector('#og-output')!;

    const update = () => this.update(root);
    [this.titleInput, this.descInput, this.urlInput, this.imageInput].forEach((el) =>
      el.addEventListener('input', update),
    );

    root.querySelector('#og-copy')!.addEventListener('click', () => {
      void copyToClipboard(this.outputEl.textContent || '');
      Toast.copied('Meta Tags');
      logToolAction('og-preview', 'Copied OG meta tags');
    });

    this.update(root);
  }

  private update(root: HTMLElement): void {
    const title = this.titleInput.value || 'Page Title';
    const desc = this.descInput.value || 'Description will appear here...';
    const url = this.urlInput.value || 'https://example.com';
    const image = this.imageInput.value;
    const domain = this.extractDomain(url);

    const twTitle = root.querySelector('#og-twitter .ogp-card__title')!;
    const twDesc = root.querySelector('#og-twitter .ogp-card__desc')!;
    const twSite = root.querySelector('#og-twitter .ogp-card__site')!;
    const twImg = root.querySelector('#og-twitter-img') as HTMLElement;
    twTitle.textContent = title;
    twDesc.textContent = desc;
    twSite.textContent = domain;
    twImg.style.backgroundImage = image ? `url(${image})` : '';

    const fbTitle = root.querySelector('#og-facebook .ogp-card__title')!;
    const fbDesc = root.querySelector('#og-facebook .ogp-card__desc')!;
    const fbSite = root.querySelector('#og-facebook .ogp-card__site')!;
    const fbImg = root.querySelector('#og-fb-img') as HTMLElement;
    fbTitle.textContent = title;
    fbDesc.textContent = desc;
    fbSite.textContent = domain.toUpperCase();
    fbImg.style.backgroundImage = image ? `url(${image})` : '';

    const liTitle = root.querySelector('#og-linkedin .ogp-card__title')!;
    const liSite = root.querySelector('#og-linkedin .ogp-card__site')!;
    const liImg = root.querySelector('#og-li-img') as HTMLElement;
    liTitle.textContent = title;
    liSite.textContent = domain;
    liImg.style.backgroundImage = image ? `url(${image})` : '';

    let tags = '';
    if (this.titleInput.value)
      tags += `<meta property="og:title" content="${this.titleInput.value}">\n`;
    if (this.descInput.value)
      tags += `<meta property="og:description" content="${this.descInput.value}">\n`;
    if (this.urlInput.value) tags += `<meta property="og:url" content="${this.urlInput.value}">\n`;
    if (this.imageInput.value)
      tags += `<meta property="og:image" content="${this.imageInput.value}">\n`;
    tags += `<meta property="og:type" content="website">\n`;
    if (this.titleInput.value)
      tags += `<meta name="twitter:title" content="${this.titleInput.value}">\n`;
    if (this.descInput.value)
      tags += `<meta name="twitter:description" content="${this.descInput.value}">\n`;
    if (this.imageInput.value)
      tags += `<meta name="twitter:image" content="${this.imageInput.value}">\n`;
    tags += `<meta name="twitter:card" content="summary_large_image">`;
    this.outputEl.textContent = tags || '<!-- Fill in fields to generate tags -->';
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'example.com';
    }
  }

  destroy(): void {}
}
