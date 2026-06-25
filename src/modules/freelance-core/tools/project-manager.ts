import { getCurrencySymbol } from '../../../components/SettingsPanel';
import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { type Client, db, type Project } from '../../../core/db';
import { router } from '../../../core/router';
import type { Tool } from '../../../types';
import { escapeHtml } from '../../../utils/image';

type FilterStatus = 'all' | 'active' | 'completed' | 'archived';

export class ProjectManager implements Tool {
  id = 'project-manager';
  name = 'Projects';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`;

  private projects: Project[] = [];
  private clients: Client[] = [];
  private clientMap = new Map<number, string>();
  private listEl!: HTMLDivElement;
  private filter: FilterStatus = 'active';
  private currencySymbol = '$';
  private locale = 'en-US';
  private editingId: number | null = null;
  private showForm = false;

  render(): string {
    return `
      <div class="tool-area">
        <div class="fcpm-header">
          <div class="fcpm-filters" id="fcpm-filters">
            <button class="btn btn--ghost btn--sm fcpm-filter-btn fcpm-filter-btn--active" data-filter="active">Active</button>
            <button class="btn btn--ghost btn--sm fcpm-filter-btn" data-filter="completed">Completed</button>
            <button class="btn btn--ghost btn--sm fcpm-filter-btn" data-filter="archived">Archived</button>
            <button class="btn btn--ghost btn--sm fcpm-filter-btn" data-filter="all">All</button>
          </div>
          <button class="btn btn--primary btn--sm" id="fcpm-new">+ New Project</button>
        </div>
        <div class="fcpm-form-wrap" id="fcpm-form-wrap" style="display:none;"></div>
        <div class="fcpm-list" id="fcpm-list"></div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.listEl = root.querySelector('#fcpm-list')!;

    const [projects, clients, defaultCurrency, defaultLocale] = await Promise.all([
      db.getAllProjects(),
      db.getAllClients(),
      db.getPreference('defaultCurrency', 'USD') as Promise<string>,
      db.getPreference('defaultLocale', 'en-US') as Promise<string>,
    ]);

    this.projects = projects;
    this.clients = clients;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');
    this.locale = defaultLocale || 'en-US';
    this.clients.forEach((c) => this.clientMap.set(c.id, c.name));

    // Filter buttons
    root.querySelectorAll('.fcpm-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('.fcpm-filter-btn')
          .forEach((b) => b.classList.remove('fcpm-filter-btn--active'));
        btn.classList.add('fcpm-filter-btn--active');
        this.filter = (btn as HTMLElement).dataset.filter as FilterStatus;
        this.renderList();
      });
    });

    // New project button
    root.querySelector('#fcpm-new')!.addEventListener('click', () => {
      this.editingId = null;
      this.showForm = true;
      this.renderForm(root.querySelector('#fcpm-form-wrap')!);
    });

    this.renderList();
  }

  private renderList(): void {
    const filtered =
      this.filter === 'all' ? this.projects : this.projects.filter((p) => p.status === this.filter);

    if (filtered.length === 0) {
      this.listEl.innerHTML = `
        <div class="fcpm-empty">
          <p>No ${this.filter === 'all' ? '' : this.filter} projects found.</p>
          <button class="btn btn--ghost btn--sm" id="fcpm-empty-new">Create your first project</button>
        </div>
      `;
      this.listEl.querySelector('#fcpm-empty-new')?.addEventListener('click', () => {
        this.editingId = null;
        this.showForm = true;
        this.renderForm(document.getElementById('fcpm-form-wrap')!);
      });
      return;
    }

    this.listEl.innerHTML = filtered
      .map((p) => {
        const clientName = this.clientMap.get(p.clientId) || 'Unknown Client';
        const statusColors: Record<string, string> = {
          active: 'var(--color-success)',
          completed: 'var(--text-muted)',
          archived: 'var(--text-ghost)',
        };
        const deadline = p.deadline ? this.formatDeadline(p.deadline) : '';
        const isUrgent =
          p.deadline &&
          this.getDeadlineDays(p.deadline) <= 7 &&
          this.getDeadlineDays(p.deadline) >= 0;

        return `
        <div class="fcpm-card" data-project-id="${p.id}">
          <div class="fcpm-card__header">
            <span class="fcpm-card__name">${escapeHtml(p.name)}</span>
            <span class="fcpm-card__status" style="color:${statusColors[p.status]}">${p.status}</span>
          </div>
          <div class="fcpm-card__meta">
            <span class="fcpm-card__client">${escapeHtml(clientName)}</span>
            ${p.budget ? `<span class="fcpm-card__budget">${p.currency || this.currencySymbol}${p.budget.toLocaleString(this.locale)}</span>` : ''}
            ${deadline ? `<span class="fcpm-card__deadline ${isUrgent ? 'fcpm-card__deadline--urgent' : ''}">${deadline}</span>` : ''}
          </div>
          ${p.description ? `<p class="fcpm-card__desc">${escapeHtml(p.description)}</p>` : ''}
          <div class="fcpm-card__actions">
            <button class="btn btn--ghost btn--sm fcpm-edit" data-id="${p.id}">Edit</button>
            <button class="btn btn--ghost btn--sm fcpm-delete" data-id="${p.id}">Delete</button>
            <button class="btn btn--ghost btn--sm fcpm-track" data-id="${p.id}" data-name="${p.name}">Track Time →</button>
          </div>
        </div>
      `;
      })
      .join('');

    // Edit buttons
    this.listEl.querySelectorAll('.fcpm-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt((btn as HTMLElement).dataset.id!);
        this.editProject(id);
      });
    });

    // Delete buttons
    this.listEl.querySelectorAll('.fcpm-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt((btn as HTMLElement).dataset.id!);
        await this.deleteProject(id);
      });
    });

    // Track time buttons
    this.listEl.querySelectorAll('.fcpm-track').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt((btn as HTMLElement).dataset.id!);
        const name = (btn as HTMLElement).dataset.name!;
        db.setPreference('fc-preselect-project', { projectId: id, projectName: name });
        router.navigate('freelance-core', 'time-tracker');
      });
    });
  }

  private editProject(id: number): void {
    const project = this.projects.find((p) => p.id === id);
    if (!project) return;
    this.editingId = id;
    this.showForm = true;
    this.renderForm(document.getElementById('fcpm-form-wrap')!, project);
  }

  private async deleteProject(id: number): Promise<void> {
    if (!confirm('Delete this project?')) return;
    this.projects = this.projects.filter((p) => p.id !== id);
    await db.deleteProject(id);
    this.renderList();
    Toast.success('Project deleted');
    logToolAction('project-manager', 'Deleted project');
  }

  private renderForm(wrapEl: HTMLElement, project?: Project): void {
    wrapEl.style.display = '';
    wrapEl.innerHTML = `
      <div class="fcpm-form">
        <div class="fcpm-form__row">
          <div class="form-group"><label class="label">Project Name</label>
            <input type="text" class="input" id="fcpm-name" value="${escapeHtml(project?.name || '')}" placeholder="Project name">
          </div>
          <div class="form-group"><label class="label">Client</label>
            <select class="input" id="fcpm-client">
              ${this.clients.map((c) => `<option value="${c.id}" ${project?.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="label">Description</label>
          <textarea class="input input--textarea" id="fcpm-desc" rows="2" placeholder="Brief description">${escapeHtml(project?.description || '')}</textarea>
        </div>
        <div class="fcpm-form__row">
          <div class="form-group"><label class="label">Status</label>
            <select class="input" id="fcpm-status">
              <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="archived" ${project?.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
          </div>
          <div class="form-group"><label class="label">Budget</label>
            <input type="number" class="input" id="fcpm-budget" value="${project?.budget || ''}" placeholder="0" min="0">
          </div>
          <div class="form-group"><label class="label">Deadline</label>
            <input type="date" class="input" id="fcpm-deadline" value="${project?.deadline || ''}">
          </div>
        </div>
        <div class="fcpm-form__actions">
          <button class="btn btn--ghost btn--sm" id="fcpm-cancel">Cancel</button>
          <button class="btn btn--primary btn--sm" id="fcpm-save">${project ? 'Update' : 'Create'} Project</button>
        </div>
      </div>
    `;

    wrapEl.querySelector('#fcpm-cancel')!.addEventListener('click', () => {
      wrapEl.style.display = 'none';
      this.showForm = false;
      this.editingId = null;
    });

    wrapEl.querySelector('#fcpm-save')!.addEventListener('click', () => this.saveProject());
  }

  private async saveProject(): Promise<void> {
    const name = (document.getElementById('fcpm-name') as HTMLInputElement)?.value.trim();
    if (!name) {
      Toast.error('Project name is required');
      return;
    }

    const clientId = parseInt((document.getElementById('fcpm-client') as HTMLSelectElement)?.value);
    if (!clientId || isNaN(clientId)) {
      Toast.error('Create a client first before adding projects');
      return;
    }
    const description = (document.getElementById('fcpm-desc') as HTMLTextAreaElement)?.value || '';
    const status =
      ((document.getElementById('fcpm-status') as HTMLSelectElement)?.value as Project['status']) ||
      'active';
    const budgetStr = (document.getElementById('fcpm-budget') as HTMLInputElement)?.value;
    const budget = budgetStr ? parseFloat(budgetStr) : undefined;
    const deadline =
      (document.getElementById('fcpm-deadline') as HTMLInputElement)?.value || undefined;

    if (this.editingId) {
      const existing = this.projects.find((p) => p.id === this.editingId);
      if (existing) {
        existing.name = name;
        existing.clientId = clientId;
        existing.description = description;
        existing.status = status;
        existing.budget = budget;
        existing.deadline = deadline;
        await db.updateProject(existing);
        logToolAction('project-manager', `Updated project: ${name}`);
        Toast.success('Project updated');
      }
    } else {
      const project = await db.createProject({
        clientId,
        name,
        description,
        status,
        budget,
        deadline,
      });
      this.projects.unshift(project);
      logToolAction('project-manager', `Created project: ${name}`);
      Toast.success('Project created');
    }

    this.editingId = null;
    this.showForm = false;
    const wrapEl = document.getElementById('fcpm-form-wrap')!;
    wrapEl.style.display = 'none';
    this.renderList();
  }

  private formatDeadline(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(this.locale, { month: 'short', day: 'numeric' });
  }

  private getDeadlineDays(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr + 'T00:00:00');
    return Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  destroy(): void {}
}
