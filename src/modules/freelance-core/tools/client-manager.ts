import { Toast } from '../../../components/Toast';
import { wireSharedInputs } from '../../../core/shared-inputs';

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: 'active' | 'paused' | 'completed';
}

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
  private listEl!: HTMLDivElement;
  private formEl!: HTMLDivElement;
  private editingId: number | null = null;

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

  init(root: HTMLElement): void {
    this.listEl = root.querySelector('#fccl-list')!;
    this.formEl = root.querySelector('#fccl-form')!;

    const stored = localStorage.getItem('fccl-clients');
    if (stored) this.clients = JSON.parse(stored);

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

    this.save();
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
    this.save();
    this.renderList();
  }

  private clearForm(): void {
    this.editingId = null;
    ['fccl-name', 'fccl-company', 'fccl-email', 'fccl-phone', 'fccl-notes'].forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = '';
    });
    (document.getElementById('fccl-status') as HTMLSelectElement).value = 'active';
  }

  private renderList(): void {
    const statusColors: Record<string, string> = {
      active: 'var(--color-success)',
      paused: 'var(--color-warning)',
      completed: 'var(--text-muted)',
    };

    this.listEl.innerHTML = this.clients.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-sm);">No clients yet.</p>'
      : this.clients.map(c => `
        <div class="fccl-client">
          <div class="fccl-client__header">
            <span class="fccl-client__name">${c.name}</span>
            <span class="fccl-client__status" style="color:${statusColors[c.status]}">${c.status}</span>
          </div>
          ${c.company ? `<span class="fccl-client__company">${c.company}</span>` : ''}
          <div class="fccl-client__actions">
            <button class="btn btn--ghost btn--sm fccl-edit" data-id="${c.id}">Edit</button>
            <button class="btn btn--ghost btn--sm fccl-delete" data-id="${c.id}">×</button>
          </div>
        </div>
      `).join('');

    this.listEl.querySelectorAll('.fccl-edit').forEach(btn => {
      btn.addEventListener('click', (e) => this.editClient(parseInt((e.target as HTMLElement).dataset.id!)));
    });

    this.listEl.querySelectorAll('.fccl-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.deleteClient(parseInt((e.target as HTMLElement).dataset.id!));
      });
    });
  }

  private save(): void {
    localStorage.setItem('fccl-clients', JSON.stringify(this.clients));
  }

  destroy(): void {}
}
