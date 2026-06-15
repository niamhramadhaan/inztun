import { Toast } from '../../../components/Toast';
import { wireSharedInputs } from '../../../core/shared-inputs';

const PRESETS: Record<string, { source: string; medium: string }> = {
  'Google / CPC': { source: 'google', medium: 'cpc' },
  'Facebook / Social': { source: 'facebook', medium: 'social' },
  'Twitter / Social': { source: 'twitter', medium: 'social' },
  'LinkedIn / Social': { source: 'linkedin', medium: 'social' },
  'Instagram / Social': { source: 'instagram', medium: 'social' },
  'Email / Newsletter': { source: 'newsletter', medium: 'email' },
  'Direct / None': { source: '(direct)', medium: '(none)' },
};

export class UtmBuilder {
  id = 'utm-builder';
  name = 'UTM Builder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>`;
  badge = '';
  private urlInput!: HTMLInputElement;
  private sourceInput!: HTMLInputElement;
  private mediumInput!: HTMLInputElement;
  private campaignInput!: HTMLInputElement;
  private termInput!: HTMLInputElement;
  private contentInput!: HTMLInputElement;
  private previewEl!: HTMLPreElement;
  private presetSelect!: HTMLSelectElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Website URL</label>
          <input type="url" class="input" id="mlu-url" placeholder="https://example.com/landing-page" value="https://example.com">
        </div>
        <div class="form-group">
          <label class="label">Preset</label>
          <select class="input" id="mlu-preset">
            <option value="">Custom</option>
            ${Object.keys(PRESETS).map(k => `<option value="${k}">${k}</option>`).join('')}
          </select>
        </div>
        <div class="mlu-fields">
          <div class="form-group"><label class="label" data-shared>Source *</label><input type="text" class="input" id="mlu-source" placeholder="google"></div>
          <div class="form-group"><label class="label" data-shared>Medium *</label><input type="text" class="input" id="mlu-medium" placeholder="cpc"></div>
          <div class="form-group"><label class="label" data-shared>Campaign *</label><input type="text" class="input" id="mlu-campaign" placeholder="spring-sale"></div>
          <div class="form-group"><label class="label">Term</label><input type="text" class="input" id="mlu-term" placeholder="running shoes"></div>
          <div class="form-group"><label class="label">Content</label><input type="text" class="input" id="mlu-content" placeholder="banner-ad"></div>
        </div>
        <label class="label">Generated URL</label>
        <pre class="input input--textarea" id="mlu-preview" style="min-height:60px;cursor:text;word-break:break-all;"></pre>
        <div class="tool-actions">
          <button class="btn btn--primary" id="mlu-copy">Copy URL</button>
          <button class="btn btn--ghost" id="mlu-copy-params">Copy Params Only</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.urlInput = root.querySelector('#mlu-url')!;
    this.sourceInput = root.querySelector('#mlu-source')!;
    this.mediumInput = root.querySelector('#mlu-medium')!;
    this.campaignInput = root.querySelector('#mlu-campaign')!;
    this.termInput = root.querySelector('#mlu-term')!;
    this.contentInput = root.querySelector('#mlu-content')!;
    this.previewEl = root.querySelector('#mlu-preview')!;
    this.presetSelect = root.querySelector('#mlu-preset')!;

    this.presetSelect.addEventListener('change', () => {
      const preset = PRESETS[this.presetSelect.value];
      if (preset) {
        this.sourceInput.value = preset.source;
        this.mediumInput.value = preset.medium;
      }
      this.update();
    });

    const update = () => this.update();
    [this.urlInput, this.sourceInput, this.mediumInput, this.campaignInput, this.termInput, this.contentInput].forEach(el => {
      el.addEventListener('input', update);
    });

    root.querySelector('#mlu-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.previewEl.textContent || '');
      Toast.copied('URL');
    });

    root.querySelector('#mlu-copy-params')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.buildParams());
      Toast.copied('Params');
    });

    wireSharedInputs(root);
    this.update();
  }

  private buildParams(): string {
    const params = new URLSearchParams();
    if (this.sourceInput.value) params.set('utm_source', this.sourceInput.value);
    if (this.mediumInput.value) params.set('utm_medium', this.mediumInput.value);
    if (this.campaignInput.value) params.set('utm_campaign', this.campaignInput.value);
    if (this.termInput.value) params.set('utm_term', this.termInput.value);
    if (this.contentInput.value) params.set('utm_content', this.contentInput.value);
    return params.toString();
  }

  private update(): void {
    const base = this.urlInput.value.trim();
    const params = this.buildParams();
    if (!base || !params) {
      this.previewEl.textContent = base || 'Enter a URL and UTM parameters';
      return;
    }
    const sep = base.includes('?') ? '&' : '?';
    this.previewEl.textContent = `${base}${sep}${params}`;
  }

  destroy(): void {}
}
