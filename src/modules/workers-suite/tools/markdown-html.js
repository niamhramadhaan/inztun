import { Toast } from '../../../components/Toast.js';

export class MarkdownToHtml {
  constructor() {
    this.id = 'markdown-html';
    this.name = 'Markdown to HTML';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>`;
    this.badge = '';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Markdown</label>
              <span class="char-count" id="mh-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="mh-input" placeholder="Enter markdown..." spellcheck="false"># Hello

This is **bold** text.</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">HTML Output</label>
            <pre class="input input--textarea" id="mh-output" style="min-height: 120px; overflow: auto; cursor: text;"></pre>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="mh-convert">Convert</button>
          <button class="btn btn--ghost" id="mh-copy">Copy HTML</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#mh-input');
    this.outputEl = root.querySelector('#mh-output');
    this.countEl = root.querySelector('#mh-input-count');

    const bind = (id, fn) => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('mh-convert', () => this.convert());
    bind('mh-copy', () => {
      navigator.clipboard.writeText(this.outputEl.textContent);
      Toast.copied('HTML');
    });

    this.inputEl?.addEventListener('input', () => this.updateCount());
    this.convert();
    this.updateCount();
  }

  updateCount() {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = `${this.inputEl.value.length} chars`;
    }
  }

  convert() {
    const md = this.inputEl.value;
    let html = md;

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => 
      `<pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>`
    );
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    this.outputEl.textContent = html;
    Toast.success('Converted');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy() {}
}
