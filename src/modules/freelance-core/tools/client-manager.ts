import { Toast } from '../../../components/Toast';
import { db, type Client, type Project, type Note } from '../../../core/db';
import { router } from '../../../core/router';
import { wireSharedInputs } from '../../../core/shared-inputs';
import { getCurrencySymbol } from '../../../components/SettingsPanel';

export class ClientManager {
  id = 'client-manager';
  name = 'Client Manager';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`;
  badge = '';
  private clients: Client[] = [];
  private projects: Project[] = [];
  private clientNotes: Map<number, Note[]> = new Map();
  private listEl!: HTMLDivElement;
  private formEl!: HTMLDivElement;
  private editingId: number | null = null;
  private expandedClientId: number | null = null;
  private projectFormClientId: number | null = null;
  private editingProjectId: number | null = null;
  private locale = 'en-US';
  private currencySymbol = '$';

  render(): string {
    return `
      <div class="tool-area">
        <div class="fccl-layout">
          <div class="fccl-list" id="fccl-list"></div>
          <div class="fccl-form" id="fccl-form">
            <div class="form-group"><label class="label" data-shared>Name</label><input type="text" class="input" id="fccl-name" placeholder="John Doe"></div>
            <div class="form-group"><label class="label" data-shared>Company</label><input type="text" class="input" id="fccl-company" placeholder="Acme Corp"></div>
            <div class="form-group"><label class="label" data-shared>Email</label><input type="email" class="input" id="fccl-email" placeholder="john@example.com"></div>
            <div class="form-group"><label class="label" data-shared>Phone</label><input type="tel" class="input" id="fccl-phone" placeholder="+1 555 0123"></div>
            <div class="form-group"><label class="label">Status</label>
              <select class="input" id="fccl-status">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div class="form-group"><label class="label">Notes</label><textarea class="input input--textarea" id="fccl-notes" rows="3" placeholder="Project details, meeting notes..."></textarea></div>
            <div class="tool-actions">
              <button class="btn btn--primary" id="fccl-save">Save</button>
              <button class="btn btn--ghost" id="fccl-clear">Clear</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.listEl = root.querySelector('#fccl-list')!;
    this.formEl = root.querySelector('#fccl-form')!;

    const [clients, projects, allNotes, defaultLocale, defaultCurrency] = await Promise.all([
      db.getAllClients(),
      db.getAllProjects(),
      db.getAllNotes(),
      db.getPreference('defaultLocale', 'en-US') as Promise<string>,
      db.getPreference('defaultCurrency', 'USD') as Promise<string>,
    ]);
    this.clients = clients;
    this.projects = projects;
    this.locale = defaultLocale || 'en-US';
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');

    this.clientNotes = new Map();
    for (const note of allNotes) {
      if (note.clientId) {
        if (!this.clientNotes.has(note.clientId)) this.clientNotes.set(note.clientId, []);
        this.clientNotes.get(note.clientId)!.push(note);
      }
    }

    root.querySelector('#fccl-save')!.addEventListener('click', () => this.saveClient());
    root.querySelector('#fccl-clear')!.addEventListener('click', () => this.clearForm());

    wireSharedInputs(root);
    this.renderList();
  }

  private saveClient(): void {
    const name = (document.getElementById('fccl-name') as HTMLInputElement).value.trim();
    if (!name) return;

    const client: Client = {
      id: this.editingId || Date.now(),
      name,
      company: (document.getElementById('fccl-company') as HTMLInputElement).value,
      email: (document.getElementById('fccl-email') as HTMLInputElement).value,
      phone: (document.getElementById('fccl-phone') as HTMLInputElement).value,
      status: (document.getElementById('fccl-status') as HTMLSelectElement).value as Client['status'],
      notes: (document.getElementById('fccl-notes') as HTMLTextAreaElement).value,
    };

    if (this.editingId) {
      const i = this.clients.findIndex(c => c.id === this.editingId);
      if (i >= 0) this.clients[i] = client;
    } else {
      this.clients.unshift(client);
    }

    db.putClient(client);
    db.logActivity(this.editingId ? 'client-update' : 'client-add', `${this.editingId ? 'Updated' : 'Added'} client: ${client.name}`);
    this.renderList();
    this.clearForm();
    Toast.success(this.editingId ? 'Client updated' : 'Client added');
  }

  private editClient(id: number): void {
    const client = this.clients.find(c => c.id === id);
    if (!client) return;

    this.editingId = id;
    (document.getElementById('fccl-name') as HTMLInputElement).value = client.name;
    (document.getElementById('fccl-company') as HTMLInputElement).value = client.company;
    (document.getElementById('fccl-email') as HTMLInputElement).value = client.email;
    (document.getElementById('fccl-phone') as HTMLInputElement).value = client.phone;
    (document.getElementById('fccl-status') as HTMLSelectElement).value = client.status;
    (document.getElementById('fccl-notes') as HTMLTextAreaElement).value = client.notes;
  }

  private deleteClient(id: number): void {
    this.clients = this.clients.filter(c => c.id !== id);
    db.deleteClient(id);
    this.renderList();
    Toast.success('Client deleted');
  }

  private clearForm(): void {
    this.editingId = null;
    ['fccl-name', 'fccl-company', 'fccl-email', 'fccl-phone', 'fccl-notes'].forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = '';
    });
    (document.getElementById('fccl-status') as HTMLSelectElement).value = 'active';
  }

  private toggleExpandClient(clientId: number): void {
    this.expandedClientId = this.expandedClientId === clientId ? null : clientId;
    this.projectFormClientId = null;
    this.editingProjectId = null;
    this.renderList();
  }

  private toggleProjectForm(clientId: number): void {
    if (this.projectFormClientId === clientId) {
      this.projectFormClientId = null;
      this.editingProjectId = null;
    } else {
      this.projectFormClientId = clientId;
      this.editingProjectId = null;
    }
    this.renderList();
  }

  private editProject(project: Project): void {
    this.projectFormClientId = project.clientId;
    this.editingProjectId = project.id;
    this.expandedClientId = project.clientId;
    this.renderList();
  }

  private async saveProject(clientId: number): Promise<void> {
    const name = (document.getElementById(`fcpj-name-${clientId}`) as HTMLInputElement)?.value.trim();
    if (!name) return;

    const description = (document.getElementById(`fcpj-desc-${clientId}`) as HTMLTextAreaElement)?.value || '';
    const status = (document.getElementById(`fcpj-status-${clientId}`) as HTMLSelectElement)?.value as Project['status'] || 'active';
    const budgetStr = (document.getElementById(`fcpj-budget-${clientId}`) as HTMLInputElement)?.value;
    const budget = budgetStr ? parseFloat(budgetStr) : undefined;
    const currency = (document.getElementById(`fcpj-currency-${clientId}`) as HTMLInputElement)?.value || undefined;
    const deadline = (document.getElementById(`fcpj-deadline-${clientId}`) as HTMLInputElement)?.value || undefined;

    if (this.editingProjectId) {
      const existing = this.projects.find(p => p.id === this.editingProjectId);
      if (existing) {
        existing.name = name;
        existing.description = description;
        existing.status = status;
        existing.budget = budget;
        existing.currency = currency;
        existing.deadline = deadline;
        await db.updateProject(existing);
        db.logActivity('project-update', `Updated project: ${name}`);
        Toast.success('Project updated');
      }
    } else {
      const project = await db.createProject({ clientId, name, description, status, budget, currency, deadline });
      this.projects.unshift(project);
      db.logActivity('project-create', `Created project: ${name}`);
      Toast.success('Project created');
    }

    this.projectFormClientId = null;
    this.editingProjectId = null;
    this.renderList();
  }

  private async deleteProject(projectId: number): Promise<void> {
    this.projects = this.projects.filter(p => p.id !== projectId);
    await db.deleteProject(projectId);
    this.renderList();
    Toast.success('Project deleted');
  }

  private getClientProjects(clientId: number): Project[] {
    return this.projects.filter(p => p.clientId === clientId);
  }

  private renderList(): void {
    const statusColors: Record<string, string> = {
      active: 'var(--color-success)',
      paused: 'var(--color-warning)',
      completed: 'var(--text-muted)',
    };

    const projectStatusColors: Record<string, string> = {
      active: 'var(--color-success)',
      completed: 'var(--accent)',
      archived: 'var(--text-muted)',
    };

    this.listEl.innerHTML = this.clients.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-sm);">No clients yet.</p>'
      : this.clients.map(c => {
        const isExpanded = this.expandedClientId === c.id;
        const clientProjects = this.getClientProjects(c.id);
        const activeCount = clientProjects.filter(p => p.status === 'active').length;

        let projectsHtml = '';
        if (isExpanded) {
          const showProjectForm = this.projectFormClientId === c.id;
          const editingProject = this.editingProjectId ? this.projects.find(p => p.id === this.editingProjectId) : null;

          projectsHtml = `
            <div class="fccl-projects">
              <div class="fccl-projects__header">
                <span class="fccl-projects__count">${clientProjects.length} project${clientProjects.length !== 1 ? 's' : ''}</span>
                <button class="btn btn--ghost btn--sm fccl-new-project" data-client-id="${c.id}">+ New Project</button>
              </div>
              ${showProjectForm ? this.renderProjectForm(c.id, editingProject) : ''}
              ${clientProjects.length === 0 && !showProjectForm
                ? '<p style="color:var(--text-ghost);font-size:var(--text-xs);padding:var(--space-2) 0;">No projects yet.</p>'
                : clientProjects.map(p => `
                  <div class="fccl-project-card">
                    <div class="fccl-project-card__header">
                      <span class="fccl-project-card__name">${p.name}</span>
                      <span class="fccl-project-card__status" style="color:${projectStatusColors[p.status]}">${p.status}</span>
                    </div>
                    <div class="fccl-project-card__meta">
                      ${p.deadline ? `<span class="fccl-project-card__deadline">${this.formatDeadline(p.deadline)}</span>` : ''}
                      ${p.budget ? `<span class="fccl-project-card__budget">${p.currency || this.currencySymbol}${p.budget.toLocaleString()}</span>` : ''}
                    </div>
                    ${p.description ? `<p class="fccl-project-card__desc">${p.description}</p>` : ''}
                    <div class="fccl-project-card__actions">
                      <button class="btn btn--ghost btn--sm fccl-edit-project" data-project-id="${p.id}">Edit</button>
                      <button class="btn btn--ghost btn--sm fccl-delete-project" data-project-id="${p.id}">×</button>
                    </div>
                  </div>
                `).join('')}
            </div>
            ${this.renderClientNotes(c.id)}
          `;
        }

        return `
          <div class="fccl-client ${isExpanded ? 'fccl-client--expanded' : ''}">
            <div class="fccl-client__header fccl-client__header--clickable" data-client-id="${c.id}">
              <span class="fccl-client__name">${c.name}</span>
              <span class="fccl-client__badges">
                ${activeCount > 0 ? `<span class="fccl-client__project-count">${activeCount} active</span>` : ''}
                <span class="fccl-client__status" style="color:${statusColors[c.status]}">${c.status}</span>
              </span>
            </div>
            ${c.company ? `<span class="fccl-client__company">${c.company}</span>` : ''}
            <div class="fccl-client__actions">
              <button class="btn btn--ghost btn--sm fccl-edit" data-id="${c.id}">Edit</button>
              <button class="btn btn--ghost btn--sm fccl-delete" data-id="${c.id}">×</button>
            </div>
            ${projectsHtml}
          </div>
        `;
      }).join('');

    this.bindListEvents();
  }

  private renderProjectForm(clientId: number, existing: Project | null): string {
    return `
      <div class="fccl-project-form">
        <div class="fccl-project-form__fields">
          <div class="form-group"><label class="label">Project Name</label>
            <input type="text" class="input" id="fcpj-name-${clientId}" placeholder="Website Redesign" value="${existing?.name || ''}">
          </div>
          <div class="form-group"><label class="label">Description</label>
            <textarea class="input input--textarea" id="fcpj-desc-${clientId}" rows="2" placeholder="Project details...">${existing?.description || ''}</textarea>
          </div>
          <div class="fccl-project-form__row">
            <div class="form-group"><label class="label">Status</label>
              <select class="input" id="fcpj-status-${clientId}">
                <option value="active" ${existing?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="completed" ${existing?.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="archived" ${existing?.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>
            <div class="form-group"><label class="label">Deadline</label>
              <input type="date" class="input" id="fcpj-deadline-${clientId}" value="${existing?.deadline || ''}">
            </div>
          </div>
          <div class="fccl-project-form__row">
            <div class="form-group"><label class="label">Budget</label>
              <input type="number" class="input" id="fcpj-budget-${clientId}" placeholder="0.00" min="0" step="0.01" value="${existing?.budget || ''}">
            </div>
            <div class="form-group"><label class="label">Currency</label>
              <input type="text" class="input" id="fcpj-currency-${clientId}" placeholder="USD" maxlength="3" value="${existing?.currency || ''}">
            </div>
          </div>
          <div class="tool-actions">
            <button class="btn btn--primary btn--sm fccl-save-project" data-client-id="${clientId}">${existing ? 'Update' : 'Create'}</button>
            <button class="btn btn--ghost btn--sm fccl-cancel-project" data-client-id="${clientId}">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderClientNotes(clientId: number): string {
    const notes = this.clientNotes.get(clientId) || [];
    if (notes.length === 0) return '';

    return `
      <div class="fccl-notes-section">
        <div class="fccl-notes-section__header">
          <span class="fccl-notes-section__count">${notes.length} note${notes.length !== 1 ? 's' : ''}</span>
          <button class="btn btn--ghost btn--sm fccl-open-scratchpad" data-client-id="${clientId}">Open in Scratchpad</button>
        </div>
        ${notes.slice(0, 3).map(n => {
          const date = new Date(n.updatedAt).toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
          const preview = n.content.replace(/[#*`\[\]>_~-]/g, '').trim().slice(0, 50);
          return `
            <div class="fccl-note-item" data-note-id="${n.id}">
              <span class="fccl-note-item__title">${n.title || 'Untitled'}</span>
              <span class="fccl-note-item__date">${date}</span>
            </div>
          `;
        }).join('')}
        ${notes.length > 3 ? `<span class="fccl-notes-section__more">+${notes.length - 3} more</span>` : ''}
      </div>
    `;
  }

  private formatDeadline(deadline: string): string {
    const d = new Date(deadline + 'T00:00:00');
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays}d`;
    return d.toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }

  private bindListEvents(): void {
    this.listEl.querySelectorAll('.fccl-client__header--clickable').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.fccl-client__badges') || target.closest('.fccl-client__name')) {
          this.toggleExpandClient(parseInt(target.closest('[data-client-id]')!.getAttribute('data-client-id')!));
        }
      });
    });

    this.listEl.querySelectorAll('.fccl-client__header--clickable').forEach(el => {
      el.addEventListener('click', () => {
        this.toggleExpandClient(parseInt(el.getAttribute('data-client-id')!));
      });
    });

    this.listEl.querySelectorAll('.fccl-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editClient(parseInt((e.target as HTMLElement).dataset.id!));
      });
    });

    this.listEl.querySelectorAll('.fccl-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteClient(parseInt((e.target as HTMLElement).dataset.id!));
      });
    });

    this.listEl.querySelectorAll('.fccl-new-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleProjectForm(parseInt((e.target as HTMLElement).dataset.clientId!));
      });
    });

    this.listEl.querySelectorAll('.fccl-save-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.saveProject(parseInt((e.target as HTMLElement).dataset.clientId!));
      });
    });

    this.listEl.querySelectorAll('.fccl-cancel-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.projectFormClientId = null;
        this.editingProjectId = null;
        this.renderList();
      });
    });

    this.listEl.querySelectorAll('.fccl-edit-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = parseInt((e.target as HTMLElement).dataset.projectId!);
        const project = this.projects.find(p => p.id === projectId);
        if (project) this.editProject(project);
      });
    });

    this.listEl.querySelectorAll('.fccl-delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteProject(parseInt((e.target as HTMLElement).dataset.projectId!));
      });
    });

    this.listEl.querySelectorAll('.fccl-open-scratchpad').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate('workers-suite', 'scratchpad');
      });
    });

    this.listEl.querySelectorAll('.fccl-note-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate('workers-suite', 'scratchpad');
      });
    });
  }

  destroy(): void {}
}
