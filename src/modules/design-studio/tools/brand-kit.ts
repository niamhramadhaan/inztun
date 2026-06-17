import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import type { Tool } from '../../../types';

interface BrandKitData {
  name: string;
  logoDataUrl: string;
  colors: string[];
  fonts: { heading: string; body: string };
  tagline: string;
}

export class BrandKit implements Tool {
  id = 'brand-kit';
  name = 'Brand Kit';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 2h3a2 2 0 0 1 2 2v3"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
  </svg>`;

  private kit: BrandKitData = {
    name: '',
    logoDataUrl: '',
    colors: ['#1a1a1a', '#c9a96e', '#ffffff'],
    fonts: { heading: 'Montserrat, sans-serif', body: 'Inter, sans-serif' },
    tagline: '',
  };

  render(): string {
    return `
      <div class="tool-area">
        <div class="bk-layout">
          <div class="bk-controls">
            <div class="form-group">
              <label class="label">Brand Name</label>
              <input type="text" class="input" id="bk-name" placeholder="My Brand" value="${this.kit.name}">
            </div>
            <div class="form-group">
              <label class="label">Tagline</label>
              <input type="text" class="input" id="bk-tagline" placeholder="Your brand tagline" value="${this.kit.tagline}">
            </div>
            <div class="form-group">
              <label class="label">Logo</label>
              <div class="bk-logo-upload" id="bk-logo-upload">
                <input type="file" accept="image/*" id="bk-logo-input" hidden>
                <div class="bk-logo-preview" id="bk-logo-preview">
                  <span class="bk-logo-placeholder">Click to upload logo</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Brand Colors</label>
              <div class="bk-colors" id="bk-colors">
                ${this.kit.colors.map((c, i) => `
                  <div class="bk-color-item">
                    <input type="color" value="${c}" class="bk-color-input" data-i="${i}">
                    <span class="bk-color-hex">${c}</span>
                  </div>
                `).join('')}
              </div>
              <button class="btn btn--ghost btn--sm" id="bk-add-color">+ Add Color</button>
            </div>
            <div class="form-group">
              <label class="label">Heading Font</label>
              <select class="input" id="bk-heading-font">
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Playfair Display, serif">Playfair Display</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Oswald, sans-serif">Oswald</option>
                <option value="Raleway, sans-serif">Raleway</option>
                <option value="Lora, serif">Lora</option>
                <option value="DM Serif Display, serif">DM Serif Display</option>
                <option value="Bebas Neue, sans-serif">Bebas Neue</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Body Font</label>
              <select class="input" id="bk-body-font">
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="Lato, sans-serif">Lato</option>
                <option value="Source Sans Pro, sans-serif">Source Sans Pro</option>
                <option value="Merriweather, serif">Merriweather</option>
                <option value="Fira Sans, sans-serif">Fira Sans</option>
              </select>
            </div>
            <div class="tool-actions">
              <button class="btn btn--ghost" id="bk-save">Save Kit</button>
              <button class="btn btn--primary" id="bk-export">Export CSS</button>
            </div>
          </div>
          <div class="bk-preview" id="bk-preview">
            <div class="bk-preview-card">
              <div class="bk-preview-logo" id="bk-preview-logo"></div>
              <div class="bk-preview-name" id="bk-preview-name" style="font-family:Montserrat,sans-serif;">Brand Name</div>
              <div class="bk-preview-tagline" id="bk-preview-tagline" style="font-family:Inter,sans-serif;">Your tagline here</div>
              <div class="bk-preview-palette" id="bk-preview-palette"></div>
              <div class="bk-preview-sample" id="bk-preview-sample" style="font-family:Inter,sans-serif;">
                <h3 style="font-family:Montserrat,sans-serif;">Sample Heading</h3>
                <p>This is how your body text will look with the selected font pairing. Good typography creates visual hierarchy and improves readability.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const nameInput = root.querySelector('#bk-name') as HTMLInputElement;
    const taglineInput = root.querySelector('#bk-tagline') as HTMLInputElement;
    const logoUpload = root.querySelector('#bk-logo-upload')!;
    const logoInput = root.querySelector('#bk-logo-input') as HTMLInputElement;
    const logoPreview = root.querySelector('#bk-logo-preview')!;
    const colorsEl = root.querySelector('#bk-colors')!;
    const headingFont = root.querySelector('#bk-heading-font') as HTMLSelectElement;
    const bodyFont = root.querySelector('#bk-body-font') as HTMLSelectElement;
    const previewName = root.querySelector('#bk-preview-name') as HTMLElement;
    const previewTagline = root.querySelector('#bk-preview-tagline') as HTMLElement;
    const previewPalette = root.querySelector('#bk-preview-palette')!;
    const previewSample = root.querySelector('#bk-preview-sample')!;
    const previewLogo = root.querySelector('#bk-preview-logo')!;

    const updatePreview = () => {
      previewName.textContent = this.kit.name || 'Brand Name';
      previewName.style.fontFamily = this.kit.fonts.heading;
      previewTagline.textContent = this.kit.tagline || 'Your tagline here';
      previewTagline.style.fontFamily = this.kit.fonts.body;
      previewPalette.innerHTML = this.kit.colors.map(c =>
        `<div class="bk-palette-swatch" style="background:${c}" title="${c}"></div>`
      ).join('');
      const h3 = previewSample.querySelector('h3')!;
      const p = previewSample.querySelector('p')!;
      h3.style.fontFamily = this.kit.fonts.heading;
      p.style.fontFamily = this.kit.fonts.body;
      if (this.kit.logoDataUrl) {
        previewLogo.innerHTML = `<img src="${this.kit.logoDataUrl}" style="max-width:80px;max-height:80px;">`;
      }
    };

    const renderColors = () => {
      colorsEl.innerHTML = this.kit.colors.map((c, i) => `
        <div class="bk-color-item">
          <input type="color" value="${c}" class="bk-color-input" data-i="${i}">
          <span class="bk-color-hex">${c}</span>
          ${this.kit.colors.length > 1 ? `<button class="btn btn--ghost btn--sm bk-color-remove" data-i="${i}">×</button>` : ''}
        </div>
      `).join('');

      colorsEl.querySelectorAll('.bk-color-input').forEach(el => {
        el.addEventListener('input', (e) => {
          const i = parseInt((e.target as HTMLElement).dataset.i!);
          this.kit.colors[i] = (e.target as HTMLInputElement).value;
          (e.target as HTMLElement).closest('.bk-color-item')!.querySelector('.bk-color-hex')!.textContent = this.kit.colors[i];
          updatePreview();
        });
      });

      colorsEl.querySelectorAll('.bk-color-remove').forEach(el => {
        el.addEventListener('click', (e) => {
          const i = parseInt((e.target as HTMLElement).dataset.i!);
          this.kit.colors.splice(i, 1);
          renderColors();
          updatePreview();
        });
      });
    };

    nameInput.addEventListener('input', () => { this.kit.name = nameInput.value; updatePreview(); });
    taglineInput.addEventListener('input', () => { this.kit.tagline = taglineInput.value; updatePreview(); });

    logoUpload.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.kit.logoDataUrl = reader.result as string;
        logoPreview.innerHTML = `<img src="${this.kit.logoDataUrl}" style="max-width:100%;max-height:80px;">`;
        updatePreview();
      };
      reader.readAsDataURL(file);
    });

    headingFont.addEventListener('change', () => { this.kit.fonts.heading = headingFont.value; updatePreview(); });
    bodyFont.addEventListener('change', () => { this.kit.fonts.body = bodyFont.value; updatePreview(); });

    root.querySelector('#bk-add-color')!.addEventListener('click', () => {
      this.kit.colors.push('#6366f1');
      renderColors();
      updatePreview();
    });

    root.querySelector('#bk-save')!.addEventListener('click', async () => {
      await db.saveItem('brand-kit', this.kit.name || 'Untitled', this.kit);
      Toast.success('Brand kit saved');
      logToolAction('brand-kit', 'Saved brand kit');
    });

    root.querySelector('#bk-export')!.addEventListener('click', () => {
      const css = [
        `:root {`,
        `  /* Brand Colors */`,
        ...this.kit.colors.map((c, i) => `  --brand-color-${i + 1}: ${c};`),
        `  /* Brand Fonts */`,
        `  --font-heading: ${this.kit.fonts.heading};`,
        `  --font-body: ${this.kit.fonts.body};`,
        `}`,
        '',
        `/* Google Fonts */`,
        `@import url('https://fonts.googleapis.com/css2?family=${this.kit.fonts.heading.split(',')[0].replace(/ /g, '+')}:wght@400;700&family=${this.kit.fonts.body.split(',')[0].replace(/ /g, '+')}:wght@400;600&display=swap');`,
      ].join('\n');

      navigator.clipboard.writeText(css);
      Toast.copied('CSS variables');
      logToolAction('brand-kit', 'Exported brand kit CSS');
    });

    renderColors();
    updatePreview();
  }

  destroy(): void {}
}
