import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import type { Tool } from '../../../types';
import { copyToClipboard } from '../../../utils/image';

interface FontPair {
  heading: string;
  body: string;
  category: string;
}

const FONT_PAIRS: FontPair[] = [
  { heading: 'Playfair Display, serif', body: 'Source Sans Pro, sans-serif', category: 'Classic' },
  { heading: 'Montserrat, sans-serif', body: 'Merriweather, serif', category: 'Modern' },
  { heading: 'Oswald, sans-serif', body: 'Lato, sans-serif', category: 'Bold' },
  { heading: 'Raleway, sans-serif', body: 'Roboto, sans-serif', category: 'Clean' },
  { heading: 'Poppins, sans-serif', body: 'Inter, sans-serif', category: 'Tech' },
  { heading: 'Lora, serif', body: 'Open Sans, sans-serif', category: 'Editorial' },
  { heading: 'Bebas Neue, sans-serif', body: 'Nunito, sans-serif', category: 'Impact' },
  { heading: 'Cormorant Garamond, serif', body: 'Fira Sans, sans-serif', category: 'Elegant' },
  { heading: 'Archivo Black, sans-serif', body: 'Rubik, sans-serif', category: 'Strong' },
  { heading: 'DM Serif Display, serif', body: 'DM Sans, sans-serif', category: 'Refined' },
  { heading: 'Space Grotesk, sans-serif', body: 'Work Sans, sans-serif', category: 'Geometric' },
  { heading: 'Abril Fatface, serif', body: 'Poppins, sans-serif', category: 'Editorial' },
  { heading: 'Righteous, sans-serif', body: 'Quicksand, sans-serif', category: 'Playful' },
  { heading: 'Crimson Text, serif', body: 'Karla, sans-serif', category: 'Literary' },
  { heading: 'Josefin Sans, sans-serif', body: 'Libre Baskerville, serif', category: 'Vintage' },
];

export class FontPairer implements Tool {
  id = 'font-pairer';
  name = 'Font Pairer';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
  </svg>`;

  private selectedPair = 0;
  private headingSize = 36;
  private bodySize = 16;
  private customText = {
    heading: 'Heading Text',
    body: 'Body text goes here. Try different font pairs to find the perfect combination for your brand.',
  };

  render(): string {
    return `
      <div class="tool-area">
        <div class="fp-controls">
          <div class="fp-pair-list" id="fp-pair-list">
            ${FONT_PAIRS.map(
              (pair, i) => `
              <button class="btn btn--ghost btn--sm fp-pair-btn ${i === 0 ? 'fp-pair-btn--active' : ''}" data-i="${i}">
                <span class="fp-pair-cat">${pair.category}</span>
                <span class="fp-pair-name">${pair.heading.split(',')[0]} + ${pair.body.split(',')[0]}</span>
              </button>
            `,
            ).join('')}
          </div>
          <div class="fp-settings">
            <div class="form-group">
              <label class="label">Heading Size: <span id="fp-hsize-val">36</span>px</label>
              <input type="range" id="fp-hsize" class="password-slider" min="18" max="72" value="36">
            </div>
            <div class="form-group">
              <label class="label">Body Size: <span id="fp-bsize-val">16</span>px</label>
              <input type="range" id="fp-bsize" class="password-slider" min="10" max="28" value="16">
            </div>
          </div>
        </div>
        <div class="fp-preview" id="fp-preview">
          <div class="fp-preview-heading" id="fp-heading" style="font-family:'Playfair Display',serif;font-size:36px;margin-bottom:16px;color:var(--text-primary);">
            ${this.customText.heading}
          </div>
          <div class="fp-preview-body" id="fp-body" style="font-family:'Source Sans Pro',sans-serif;font-size:16px;line-height:1.6;color:var(--text-secondary);">
            ${this.customText.body}
          </div>
        </div>
        <div class="fp-css-output">
          <label class="label">CSS</label>
          <pre class="input input--textarea" id="fp-css" style="min-height:80px;cursor:text;"></pre>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="fp-copy">Copy CSS</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const headingEl = root.querySelector('#fp-heading') as HTMLElement;
    const bodyEl = root.querySelector('#fp-body') as HTMLElement;
    const cssEl = root.querySelector('#fp-css') as HTMLElement;
    const hSizeSlider = root.querySelector('#fp-hsize') as HTMLInputElement;
    const hSizeVal = root.querySelector('#fp-hsize-val') as HTMLSpanElement;
    const bSizeSlider = root.querySelector('#fp-bsize') as HTMLInputElement;
    const bSizeVal = root.querySelector('#fp-bsize-val') as HTMLSpanElement;

    const updatePreview = () => {
      const pair = FONT_PAIRS[this.selectedPair];
      headingEl.style.fontFamily = pair.heading;
      headingEl.style.fontSize = this.headingSize + 'px';
      bodyEl.style.fontFamily = pair.body;
      bodyEl.style.fontSize = this.bodySize + 'px';

      cssEl.textContent = [
        `/* ${pair.category} */`,
        `font-family: ${pair.heading}; /* Heading */`,
        `font-family: ${pair.body}; /* Body */`,
        '',
        `/* Google Fonts import */`,
        `@import url('https://fonts.googleapis.com/css2?family=${pair.heading.split(',')[0].replace(/ /g, '+')}:wght@400;700&family=${pair.body.split(',')[0].replace(/ /g, '+')}:wght@400;600&display=swap');`,
      ].join('\n');
    };

    root.querySelectorAll('.fp-pair-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.fp-pair-btn')
          .forEach((b) => b.classList.remove('fp-pair-btn--active'));
        btn.classList.add('fp-pair-btn--active');
        this.selectedPair = parseInt((btn as HTMLElement).dataset.i!);
        updatePreview();
      });
    });

    hSizeSlider.addEventListener('input', () => {
      this.headingSize = parseInt(hSizeSlider.value);
      hSizeVal.textContent = hSizeSlider.value;
      updatePreview();
    });

    bSizeSlider.addEventListener('input', () => {
      this.bodySize = parseInt(bSizeSlider.value);
      bSizeVal.textContent = bSizeSlider.value;
      updatePreview();
    });

    root.querySelector('#fp-copy')!.addEventListener('click', () => {
      void copyToClipboard(cssEl.textContent || '');
      Toast.copied('CSS');
      logToolAction('font-pairer', 'Copied font pair CSS');
    });

    updatePreview();
  }

  destroy(): void {}
}
