import { Toast } from '../../../components/Toast';

export class BorderRadius {
  id = 'border-radius';
  name = 'Border Radius Previewer';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 9V5a2 2 0 0 1 2-2h4"/>
      <path d="M21 9V5a2 2 0 0 0-2-2h-4"/>
      <path d="M3 15v4a2 2 0 0 0 2 2h4"/>
      <path d="M21 15v4a2 2 0 0 1-2 2h-4"/>
    </svg>`;
  badge = '';
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;
  private inputs!: { tl: HTMLInputElement; tr: HTMLInputElement; br: HTMLInputElement; bl: HTMLInputElement };
  private linked = true;
  private linkedBtn!: HTMLButtonElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="dsr-preview-wrap">
          <div class="dsr-preview" id="dsr-preview"></div>
        </div>
        <div class="dsr-controls">
          <button class="btn btn--sm" id="dsr-linked">Linked</button>
          <div class="dsr-inputs">
            <div class="form-group"><label class="label">Top Left</label><input type="range" id="dsr-tl" min="0" max="100" value="16" class="password-slider"><span class="dsr-val" id="dsr-tl-val">16px</span></div>
            <div class="form-group"><label class="label">Top Right</label><input type="range" id="dsr-tr" min="0" max="100" value="16" class="password-slider"><span class="dsr-val" id="dsr-tr-val">16px</span></div>
            <div class="form-group"><label class="label">Bottom Right</label><input type="range" id="dsr-br" min="0" max="100" value="16" class="password-slider"><span class="dsr-val" id="dsr-br-val">16px</span></div>
            <div class="form-group"><label class="label">Bottom Left</label><input type="range" id="dsr-bl" min="0" max="100" value="16" class="password-slider"><span class="dsr-val" id="dsr-bl-val">16px</span></div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="dsr-copy">Copy CSS</button>
        </div>
        <pre class="input input--textarea" id="dsr-output" style="min-height:60px;cursor:text;"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.previewEl = root.querySelector('#dsr-preview')!;
    this.outputEl = root.querySelector('#dsr-output')!;
    this.linkedBtn = root.querySelector('#dsr-linked')!;
    this.inputs = {
      tl: root.querySelector('#dsr-tl')!,
      tr: root.querySelector('#dsr-tr')!,
      br: root.querySelector('#dsr-br')!,
      bl: root.querySelector('#dsr-bl')!,
    };

    this.linkedBtn.addEventListener('click', () => {
      this.linked = !this.linked;
      this.linkedBtn.textContent = this.linked ? 'Linked' : 'Unlinked';
      this.linkedBtn.classList.toggle('btn--primary', this.linked);
    });

    Object.entries(this.inputs).forEach(([key, input]) => {
      input.addEventListener('input', () => {
        if (this.linked) {
          Object.values(this.inputs).forEach(i => { i.value = input.value; });
        }
        this.update();
      });
    });

    root.querySelector('#dsr-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied('CSS');
    });

    this.update();
  }

  private buildRadius(): string {
    const v = [this.inputs.tl, this.inputs.tr, this.inputs.br, this.inputs.bl].map(i => i.value + 'px');
    return v.join(' ');
  }

  private update(): void {
    const radius = this.buildRadius();
    this.previewEl.style.borderRadius = radius;
    Object.entries(this.inputs).forEach(([key, input]) => {
      const valEl = document.getElementById(`dsr-${key}-val`);
      if (valEl) valEl.textContent = input.value + 'px';
    });
    this.outputEl.textContent = `border-radius: ${radius};`;
  }

  destroy(): void {}
}
