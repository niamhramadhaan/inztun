import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { copyToClipboard } from '../../../utils/image';

export class SeoMeta {
  id = 'seo-meta';
  name = 'SEO Meta Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`;
  badge = 'Popular';
  private titleInput!: HTMLInputElement;
  private descInput!: HTMLTextAreaElement;
  private urlInput!: HTMLInputElement;
  private imageInput!: HTMLInputElement;
  private titleCountEl!: HTMLSpanElement;
  private descCountEl!: HTMLSpanElement;
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row"><label class="label">Page Title</label><span class="char-count" id="mlo-title-count">0 / 60</span></div>
          <input type="text" class="input" id="mlo-title" placeholder="My Page Title — Brand Name" maxlength="70">
        </div>
        <div class="form-group">
          <div class="label-row"><label class="label">Meta Description</label><span class="char-count" id="mlo-desc-count">0 / 160</span></div>
          <textarea class="input input--textarea" id="mlo-desc" placeholder="A compelling description that encourages clicks from search results..." rows="3" maxlength="200"></textarea>
        </div>
        <div class="mlu-fields">
          <div class="form-group"><label class="label">Page URL</label><input type="url" class="input" id="mlo-url" placeholder="https://example.com/page"></div>
          <div class="form-group"><label class="label">OG Image URL</label><input type="url" class="input" id="mlo-image" placeholder="https://example.com/image.jpg"></div>
        </div>
        <div class="mlo-google-preview" id="mlo-google-preview">
          <div class="mlo-google-title"></div>
          <div class="mlo-google-url"></div>
          <div class="mlo-google-desc"></div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="mlo-copy-tags">Copy Meta Tags</button>
        </div>
        <pre class="input input--textarea" id="mlo-output" style="min-height:100px;cursor:text;"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.titleInput = root.querySelector('#mlo-title')!;
    this.descInput = root.querySelector('#mlo-desc')!;
    this.urlInput = root.querySelector('#mlo-url')!;
    this.imageInput = root.querySelector('#mlo-image')!;
    this.titleCountEl = root.querySelector('#mlo-title-count')!;
    this.descCountEl = root.querySelector('#mlo-desc-count')!;
    this.previewEl = root.querySelector('#mlo-google-preview')!;
    this.outputEl = root.querySelector('#mlo-output')!;

    const update = () => this.update();
    [this.titleInput, this.descInput, this.urlInput, this.imageInput].forEach((el) => {
      el.addEventListener('input', update);
    });

    root.querySelector('#mlo-copy-tags')!.addEventListener('click', () => {
      void copyToClipboard(this.outputEl.textContent || '');
      Toast.copied('Meta Tags');
      logToolAction('seo-meta', 'Generated SEO meta');
    });

    this.update();
  }

  private update(): void {
    const title = this.titleInput.value;
    const desc = this.descInput.value;
    const url = this.urlInput.value;
    const image = this.imageInput.value;

    this.titleCountEl.textContent = `${title.length} / 60`;
    this.titleCountEl.style.color = title.length > 60 ? 'var(--color-error)' : '';
    this.descCountEl.textContent = `${desc.length} / 160`;
    this.descCountEl.style.color = desc.length > 160 ? 'var(--color-error)' : '';

    const googleTitle = this.previewEl.querySelector('.mlo-google-title')!;
    const googleUrl = this.previewEl.querySelector('.mlo-google-url')!;
    const googleDesc = this.previewEl.querySelector('.mlo-google-desc')!;
    googleTitle.textContent = title || 'Page Title — Brand Name';
    googleUrl.textContent = url || 'https://example.com';
    googleDesc.textContent =
      desc || 'A compelling description that encourages clicks from search results...';

    let tags = '';
    if (title) tags += `<title>${title}</title>\n`;
    if (desc) tags += `<meta name="description" content="${desc}">\n`;
    if (url) tags += `<meta property="og:url" content="${url}">\n`;
    if (title) tags += `<meta property="og:title" content="${title}">\n`;
    if (desc) tags += `<meta property="og:description" content="${desc}">\n`;
    if (image) tags += `<meta property="og:image" content="${image}">\n`;
    tags += `<meta name="twitter:card" content="summary_large_image">`;
    this.outputEl.textContent = tags || '<!-- Fill in fields to generate meta tags -->';
  }

  destroy(): void {}
}
