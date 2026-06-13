import { Toast } from '../../../components/Toast.js';

export class TextCaseConverter {
  constructor() {
    this.id = 'text-case';
    this.name = 'Text Case Converter';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
    this.badge = '';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row">
            <label class="label">Input Text</label>
            <span class="char-count" id="tc-input-count">0 chars</span>
          </div>
          <textarea class="input input--textarea" id="tc-input" placeholder="Enter text to convert..." rows="4" spellcheck="false">hello world example text</textarea>
        </div>
        <div class="case-grid" id="tc-results"></div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="tc-copy-all">Copy Selected</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#tc-input');
    this.resultsEl = root.querySelector('#tc-results');
    this.countEl = root.querySelector('#tc-input-count');

    this.inputEl?.addEventListener('input', () => {
      this.convert();
      this.updateCount();
    });

    root.querySelector('#tc-copy-all')?.addEventListener('click', () => {
      const selected = this.resultsEl.querySelector('.case-item--selected .case-value');
      if (selected) {
        navigator.clipboard.writeText(selected.textContent);
        Toast.copied('Text');
      }
    });

    this.convert();
    this.updateCount();
  }

  updateCount() {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  convert() {
    const input = this.inputEl.value;
    if (!input) {
      this.resultsEl.innerHTML = '';
      return;
    }

    const cases = [
      { id: 'lower', label: 'lowercase', value: input.toLowerCase() },
      { id: 'upper', label: 'UPPERCASE', value: input.toUpperCase() },
      { id: 'title', label: 'Title Case', value: this.toTitleCase(input) },
      { id: 'sentence', label: 'Sentence case', value: this.toSentenceCase(input) },
      { id: 'camel', label: 'camelCase', value: this.toCamelCase(input) },
      { id: 'pascal', label: 'PascalCase', value: this.toPascalCase(input) },
      { id: 'snake', label: 'snake_case', value: this.toSnakeCase(input) },
      { id: 'kebab', label: 'kebab-case', value: this.toKebabCase(input) },
      { id: 'constant', label: 'CONSTANT_CASE', value: this.toConstantCase(input) },
      { id: 'dot', label: 'dot.case', value: this.toDotCase(input) },
      { id: 'path', label: 'path/case', value: this.toPathCase(input) },
      { id: 'alternating', label: 'aLtErNaTiNg', value: this.toAlternatingCase(input) },
    ];

    this.resultsEl.innerHTML = cases.map(c => `
      <div class="case-item" data-id="${c.id}">
        <span class="case-label">${c.label}</span>
        <span class="case-value">${this.escapeHtml(c.value)}</span>
        <button class="btn btn--ghost btn--sm case-copy">Copy</button>
      </div>
    `).join('');

    this.resultsEl.querySelectorAll('.case-item').forEach(item => {
      item.querySelector('.case-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.querySelector('.case-value').textContent;
        navigator.clipboard.writeText(value);
        Toast.copied(item.querySelector('.case-label').textContent);
      });

      item.addEventListener('click', () => {
        this.resultsEl.querySelectorAll('.case-item').forEach(i => i.classList.remove('case-item--selected'));
        item.classList.add('case-item--selected');
      });
    });
  }

  toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  toSentenceCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/[\s\-_]+/g, '');
  }

  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/[\s\-_]+/g, '');
  }

  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/[\s\-]+/g, '_').replace(/^_/, '');
  }

  toKebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/[\s_]+/g, '-').replace(/^-/, '');
  }

  toConstantCase(str) {
    return this.toSnakeCase(str).toUpperCase();
  }

  toDotCase(str) {
    return str.replace(/[\s\-_]+/g, '.').toLowerCase();
  }

  toPathCase(str) {
    return str.replace(/[\s\-_]+/g, '/').toLowerCase();
  }

  toAlternatingCase(str) {
    return str.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  destroy() {}
}
