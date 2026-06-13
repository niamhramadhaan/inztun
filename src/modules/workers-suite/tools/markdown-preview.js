import { Toast } from '../../../components/Toast.js';

export class MarkdownPreview {
  constructor() {
    this.id = 'markdown-preview';
    this.name = 'Markdown Preview';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>`;
    this.badge = 'GFM';
  }

  render() {
    const defaultContent = [
      '# Hello World',
      '',
      'This is **bold** and *italic* text.',
      '',
      '## Features',
      '- Lists work',
      '- **Bold** and *italic*',
      '- Inline code',
      '- [Links](https://example.com)',
      '',
      '> Blockquotes work too',
      '',
      '| Column 1 | Column 2 |',
      '|----------|----------|',
      '| Cell 1   | Cell 2   |',
    ].join('\n');

    return `
      <div class="tool-area">
        <div class="md-split">
          <div class="md-editor">
            <div class="label-row">
              <label class="label">Markdown</label>
              <span class="char-count" id="md-input-count">0 chars</span>
            </div>
            <textarea class="input md-textarea" id="md-input" spellcheck="false">${defaultContent}</textarea>
          </div>
          <div class="md-preview">
            <label class="label">Preview</label>
            <div class="md-output" id="md-output"></div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="md-copy-html">Copy HTML</button>
          <button class="btn btn--ghost" id="md-copy-md">Copy Markdown</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#md-input');
    this.outputEl = root.querySelector('#md-output');
    this.countEl = root.querySelector('#md-input-count');

    this.inputEl?.addEventListener('input', () => {
      this.renderPreview();
      this.updateCount();
    });

    root.querySelector('#md-copy-html')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.innerHTML);
      Toast.copied('HTML');
    });

    root.querySelector('#md-copy-md')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.inputEl.value);
      Toast.copied('Markdown');
    });

    this.renderPreview();
    this.updateCount();
  }

  updateCount() {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = this.inputEl.value.length + ' chars';
    }
  }

  renderPreview() {
    this.outputEl.innerHTML = this.parseMarkdown(this.inputEl.value);
  }

  parseMarkdown(md) {
    let html = md;

    // Code blocks (triple backtick)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
      return '<pre class="md-code-block"><code class="language-' + lang + '">' + escapeHtml(code.trim()) + '</code></pre>';
    });

    // Inline code (single backtick)
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links and images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, function(match, content) {
      var cells = content.split('|').map(function(c) { return c.trim(); });
      if (cells.every(function(c) { return /^[-:]+$/.test(c); })) return '<!-- table separator -->';
      return '<tr>' + cells.map(function(c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, function(match) {
      var clean = match.replace(/<!-- table separator -->\n?/g, '');
      return '<table class="md-table">' + clean + '</table>';
    });

    // Paragraphs
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    // Clean up extra newlines
    html = html.replace(/\n{2,}/g, '\n');

    return html;
  }

  destroy() {}
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
