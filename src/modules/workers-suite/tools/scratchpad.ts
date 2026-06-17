import { Toast } from '../../../components/Toast';
import { db, type Note, type Client, type Project } from '../../../core/db';
import type { Tool } from '../../../types';

export class Scratchpad implements Tool {
  id = 'scratchpad';
  name = 'Scratchpad';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>`;
  badge = '';

  private notes: Note[] = [];
  private activeNote: Note | null = null;
  private clients: Client[] = [];
  private projects: Project[] = [];
  private mode: 'edit' | 'preview' = 'edit';
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private searchQuery = '';
  private locale = 'en-US';

  private root!: HTMLElement;
  private listEl!: HTMLDivElement;
  private editorEl!: HTMLTextAreaElement;
  private previewEl!: HTMLDivElement;
  private titleEl!: HTMLInputElement;
  private savedEl!: HTMLSpanElement;
  private searchEl!: HTMLInputElement;
  private modeBtn!: HTMLButtonElement;
  private linkClientEl!: HTMLSelectElement;
  private linkProjectEl!: HTMLSelectElement;

  render(): string {
    return `
      <div class="tool-area sp-layout">
        <div class="sp-sidebar">
          <div class="sp-sidebar__header">
            <button class="btn btn--primary btn--sm" id="sp-new">+ New Note</button>
            <input type="text" class="input sp-search" id="sp-search" placeholder="Search notes...">
          </div>
          <div class="sp-list" id="sp-list"></div>
        </div>
        <div class="sp-editor" id="sp-editor">
          <div class="sp-editor__empty" id="sp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Select a note or create a new one</p>
          </div>
          <div class="sp-editor__active" id="sp-active" style="display:none;">
            <div class="sp-editor__toolbar">
              <input type="text" class="input sp-title" id="sp-title" placeholder="Note title...">
              <div class="sp-editor__actions">
                <span class="sp-saved" id="sp-saved">Saved</span>
                <div class="sp-insert-btns">
                  <button class="btn btn--ghost btn--sm sp-insert" data-insert="bold" title="Bold">B</button>
                  <button class="btn btn--ghost btn--sm sp-insert" data-insert="italic" title="Italic"><em>I</em></button>
                  <button class="btn btn--ghost btn--sm sp-insert" data-insert="code" title="Code Block">{ }</button>
                  <button class="btn btn--ghost btn--sm sp-insert" data-insert="check" title="Checklist">☑</button>
                  <button class="btn btn--ghost btn--sm sp-insert" data-insert="hr" title="Horizontal Rule">—</button>
                </div>
                <button class="btn btn--ghost btn--sm" id="sp-mode">Preview</button>
                <button class="btn btn--ghost btn--sm" id="sp-delete" title="Delete note">×</button>
              </div>
            </div>
            <div class="sp-editor__link-row">
              <label class="label">Link to:</label>
              <select class="input sp-link-select" id="sp-link-client">
                <option value="">— Client —</option>
              </select>
              <select class="input sp-link-select" id="sp-link-project">
                <option value="">— Project —</option>
              </select>
            </div>
            <textarea class="input sp-textarea" id="sp-content" spellcheck="false" placeholder="Start writing..."></textarea>
            <div class="sp-preview md-output" id="sp-preview" style="display:none;"></div>
          </div>
        </div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.root = root;
    this.listEl = root.querySelector('#sp-list')!;
    this.editorEl = root.querySelector('#sp-content')!;
    this.previewEl = root.querySelector('#sp-preview')!;
    this.titleEl = root.querySelector('#sp-title')!;
    this.savedEl = root.querySelector('#sp-saved')!;
    this.searchEl = root.querySelector('#sp-search')!;
    this.modeBtn = root.querySelector('#sp-mode')!;
    this.linkClientEl = root.querySelector('#sp-link-client')!;
    this.linkProjectEl = root.querySelector('#sp-link-project')!;

    [this.notes, this.clients, this.projects] = await Promise.all([
      db.getAllNotes(),
      db.getAllClients(),
      db.getAllProjects(),
    ]);

    const defaultLocale = await db.getPreference('defaultLocale', 'en-US') as string;
    this.locale = defaultLocale || 'en-US';

    this.populateLinkDropdowns();
    this.renderList();

    root.querySelector('#sp-new')!.addEventListener('click', () => this.newNote());
    this.searchEl.addEventListener('input', () => {
      this.searchQuery = this.searchEl.value.toLowerCase();
      this.renderList();
    });

    this.titleEl.addEventListener('input', () => {
      if (this.activeNote) {
        this.activeNote.title = this.titleEl.value;
        this.scheduleSave();
      }
    });

    this.editorEl.addEventListener('input', () => {
      if (this.activeNote) {
        this.activeNote.content = this.editorEl.value;
        this.scheduleSave();
      }
    });

    this.modeBtn.addEventListener('click', () => this.toggleMode());

    root.querySelectorAll('.sp-insert').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = (btn as HTMLElement).dataset.insert!;
        this.insertMarkdown(type);
      });
    });

    root.querySelector('#sp-delete')!.addEventListener('click', () => this.deleteActive());

    this.linkClientEl.addEventListener('change', () => {
      if (this.activeNote) {
        this.activeNote.clientId = this.linkClientEl.value ? parseInt(this.linkClientEl.value) : undefined;
        this.scheduleSave();
      }
    });

    this.linkProjectEl.addEventListener('change', () => {
      if (this.activeNote) {
        this.activeNote.projectId = this.linkProjectEl.value ? parseInt(this.linkProjectEl.value) : undefined;
        this.scheduleSave();
      }
    });
  }

  private populateLinkDropdowns(): void {
    this.linkClientEl.innerHTML = '<option value="">— Client —</option>' +
      this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const activeProjects = this.projects.filter(p => p.status === 'active');
    this.linkProjectEl.innerHTML = '<option value="">— Project —</option>' +
      activeProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  private renderList(): void {
    let filtered = this.notes;
    if (this.searchQuery) {
      filtered = this.notes.filter(n =>
        n.title.toLowerCase().includes(this.searchQuery) ||
        n.content.toLowerCase().includes(this.searchQuery)
      );
    }

    this.listEl.innerHTML = filtered.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-xs);padding:var(--space-2);">No notes yet.</p>'
      : filtered.map(n => {
        const isActive = this.activeNote?.id === n.id;
        const date = new Date(n.updatedAt).toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
        const preview = n.content.replace(/[#*`\[\]>_~-]/g, '').trim().slice(0, 60);
        return `
          <div class="sp-note-item ${isActive ? 'sp-note-item--active' : ''}" data-id="${n.id}">
            <div class="sp-note-item__title" data-id="${n.id}">${n.title || 'Untitled'}</div>
            <div class="sp-note-item__meta">
              <span>${date}</span>
              ${n.clientId ? '<span class="sp-note-item__tag">◆</span>' : ''}
            </div>
            <div class="sp-note-item__preview">${preview || 'Empty note'}</div>
          </div>
        `;
      }).join('');

    this.listEl.querySelectorAll('.sp-note-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt((el as HTMLElement).dataset.id!);
        this.selectNote(id);
      });
    });

    this.listEl.querySelectorAll('.sp-note-item__title').forEach(el => {
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const id = parseInt((el as HTMLElement).dataset.id!);
        this.startInlineRename(id, el as HTMLElement);
      });
    });
  }

  private async newNote(): Promise<void> {
    const note = await db.createNote({ title: '', content: '' });
    this.notes.unshift(note);
    this.selectNote(note.id);
    this.renderList();
    this.titleEl.focus();
    db.logActivity('note-create', 'Created a new note');
  }

  private selectNote(id: number): void {
    const note = this.notes.find(n => n.id === id);
    if (!note) return;

    this.activeNote = note;
    this.mode = 'edit';

    (this.root.querySelector('#sp-empty') as HTMLElement).style.display = 'none';
    (this.root.querySelector('#sp-active') as HTMLElement).style.display = '';

    this.titleEl.value = note.title;
    this.editorEl.value = note.content;
    this.editorEl.style.display = '';
    this.previewEl.style.display = 'none';
    this.modeBtn.textContent = 'Preview';

    this.linkClientEl.value = note.clientId ? String(note.clientId) : '';
    this.linkProjectEl.value = note.projectId ? String(note.projectId) : '';

    this.renderList();
  }

  private startInlineRename(id: number, el: HTMLElement): void {
    const note = this.notes.find(n => n.id === id);
    if (!note) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input sp-inline-rename';
    input.value = note.title || 'Untitled';
    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
      const newTitle = input.value.trim() || 'Untitled';
      note.title = newTitle;
      db.updateNote(note);
      if (this.activeNote?.id === id) this.titleEl.value = newTitle;
      this.renderList();
      Toast.success('Note renamed');
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = note.title || 'Untitled'; input.blur(); }
    });
  }

  private toggleMode(): void {
    if (!this.activeNote) return;

    if (this.mode === 'edit') {
      this.mode = 'preview';
      this.previewEl.innerHTML = this.parseMarkdown(this.editorEl.value);
      this.editorEl.style.display = 'none';
      this.previewEl.style.display = '';
      this.modeBtn.textContent = 'Edit';
    } else {
      this.mode = 'edit';
      this.editorEl.style.display = '';
      this.previewEl.style.display = 'none';
      this.modeBtn.textContent = 'Preview';
    }
  }

  private insertMarkdown(type: string): void {
    if (!this.activeNote || this.mode !== 'edit') return;

    const textarea = this.editorEl;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let insert = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        insert = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? insert.length : 2;
        break;
      case 'italic':
        insert = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? insert.length : 1;
        break;
      case 'code':
        insert = `\n\`\`\`\n${selected || 'code'}\n\`\`\`\n`;
        cursorOffset = selected ? insert.length : 5;
        break;
      case 'check':
        insert = `- [ ] ${selected || 'task'}`;
        cursorOffset = insert.length;
        break;
      case 'hr':
        insert = `\n---\n`;
        cursorOffset = insert.length;
        break;
    }

    textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
    textarea.focus();

    this.activeNote.content = textarea.value;
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);

    this.savedEl.textContent = 'Saving...';
    this.savedEl.classList.remove('sp-saved--visible');

    this.saveTimeout = setTimeout(async () => {
      if (!this.activeNote) return;
      await db.updateNote(this.activeNote);
      this.savedEl.textContent = 'Saved';
      this.savedEl.classList.add('sp-saved--visible');
      setTimeout(() => this.savedEl.classList.remove('sp-saved--visible'), 2000);
      this.renderList();
    }, 500);
  }

  private deleteActive(): void {
    if (!this.activeNote) return;

    const id = this.activeNote.id;
    this.notes = this.notes.filter(n => n.id !== id);
    db.deleteNote(id);

    this.activeNote = null;
    (this.root.querySelector('#sp-empty') as HTMLElement).style.display = '';
    (this.root.querySelector('#sp-active') as HTMLElement).style.display = 'none';

    this.renderList();
    Toast.success('Note deleted');
  }

  private parseMarkdown(md: string): string {
    let html = md;

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      '<pre class="md-code-block"><code class="language-' + lang + '">' + this.escapeHtml(code.trim()) + '</code></pre>'
    );
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="sp-check sp-check--done">☑ $1</div>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="sp-check">☐ $1</div>');
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');
    html = html.replace(/\n{2,}/g, '\n');

    return html;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
  }
}
