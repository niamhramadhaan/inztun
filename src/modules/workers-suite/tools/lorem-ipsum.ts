import { Toast } from '../../../components/Toast';

export class LoremIpsum {
  id = 'lorem-ipsum';
  name = 'Lorem Ipsum';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
    </svg>`;
  badge = '';
  private words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
  private typeEl!: HTMLSelectElement;
  private countEl!: HTMLInputElement;
  private outputEl!: HTMLDivElement;
  private countDisplayEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="lorem-controls">
          <div class="form-group" style="flex: 1;">
            <label class="label">Type</label>
            <select class="input" id="li-type">
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
          <div class="form-group" style="width: 80px;">
            <label class="label">Count</label>
            <input class="input" id="li-count" type="number" value="3" min="1" max="100">
          </div>
        </div>
        <div class="form-group" style="flex: 1;">
          <div class="label-row">
            <label class="label">Output</label>
            <span class="char-count" id="li-output-count">0 chars</span>
          </div>
          <div class="lorem-output" id="li-output" style="flex: 1; overflow-y: auto; padding: var(--space-3); background: var(--bg-deep); border-radius: var(--radius-md); border: 1px solid var(--border-hairline);"></div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="li-generate">Generate</button>
          <button class="btn btn--ghost" id="li-copy">Copy</button>
          <button class="btn btn--ghost" id="li-download">Download .txt</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.typeEl = root.querySelector('#li-type') as HTMLSelectElement;
    this.countEl = root.querySelector('#li-count') as HTMLInputElement;
    this.outputEl = root.querySelector('#li-output') as HTMLDivElement;
    this.countDisplayEl = root.querySelector('#li-output-count') as HTMLSpanElement;

    const bind = (id: string, fn: () => void): void => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('li-generate', () => this.generate());
    bind('li-copy', () => this.copy());
    bind('li-download', () => this.download());
    this.generate();
  }

  generate(): void {
    const type = this.typeEl.value;
    const count = parseInt(this.countEl.value) || 3;
    let output = '';
    switch (type) {
      case 'paragraphs': output = Array.from({ length: count }, () => this.paragraph()).join('\n\n'); break;
      case 'sentences': output = Array.from({ length: count }, () => this.sentence()).join(' '); break;
      case 'words': output = Array.from({ length: count }, () => this.word()).join(' '); break;
    }
    this.outputEl.textContent = output;
    if (this.countDisplayEl) {
      this.countDisplayEl.textContent = `${output.length} chars`;
    }
  }

  paragraph(): string { return Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => this.sentence()).join(' '); }
  sentence(): string {
    const words = Array.from({ length: Math.floor(Math.random() * 8) + 5 }, () => this.word());
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  }
  word(): string { return this.words[Math.floor(Math.random() * this.words.length)]; }

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.outputEl.textContent || '');
    Toast.copied('Text');
  }

  download(): void {
    const blob = new Blob([this.outputEl.textContent || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lorem-ipsum.txt';
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Downloaded');
  }

  destroy(): void {}
}
