import { Toast } from '../../../components/Toast';
import { db, type TimeEntry, type Project } from '../../../core/db';
import { router } from '../../../core/router';
import { wireSharedInputs } from '../../../core/shared-inputs';

export class TimeTracker {
  id = 'time-tracker';
  name = 'Time Tracker';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`;
  badge = '';
  private running = false;
  private startTime = 0;
  private elapsed = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private entries: TimeEntry[] = [];
  private projects: Project[] = [];
  private projectInput!: HTMLInputElement;
  private projectSelect!: HTMLSelectElement;
  private timerEl!: HTMLSpanElement;
  private logEl!: HTMLDivElement;
  private totalEl!: HTMLSpanElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="fctt-controls">
          <div class="form-group"><label class="label" data-shared>Project</label><input type="text" class="input" id="fctt-project" placeholder="Client project name"></div>
          <div class="form-group"><label class="label">Linked Project</label>
            <select class="input" id="fctt-project-select">
              <option value="">— None —</option>
            </select>
          </div>
          <div class="fctt-timer">
            <span class="fctt-timer__display" id="fctt-timer">00:00:00</span>
            <button class="btn btn--primary" id="fctt-toggle">Start</button>
            <button class="btn btn--ghost" id="fctt-log">Log Entry</button>
          </div>
        </div>
        <div class="fctt-total" id="fctt-total"></div>
        <div class="fctt-log" id="fctt-log-list"></div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.projectInput = root.querySelector('#fctt-project')!;
    this.projectSelect = root.querySelector('#fctt-project-select')!;
    this.timerEl = root.querySelector('#fctt-timer')!;
    this.logEl = root.querySelector('#fctt-log-list')!;
    this.totalEl = root.querySelector('#fctt-total')!;

    this.projects = await db.getAllProjects();
    this.populateProjectSelect();

    this.entries = await db.getAllTimeEntries();

    const activeTimer = await db.getPreference('fc-active-timer') as { project: string; startTime: number; projectId?: number } | null;
    if (activeTimer) {
      this.projectInput.value = activeTimer.project;
      if (activeTimer.projectId) this.projectSelect.value = String(activeTimer.projectId);
      this.startTime = activeTimer.startTime;
      this.elapsed = (Date.now() - this.startTime) / 1000;
      this.running = true;
      this.timerInterval = setInterval(() => {
        this.elapsed = (Date.now() - this.startTime) / 1000;
        this.timerEl.textContent = this.formatTime(this.elapsed);
      }, 100);
      this.updateButton('Stop', true);
    }

    // Check for pre-selected project from home dashboard
    const preselect = await db.getPreference('fc-preselect-project') as { projectId: number; projectName: string } | null;
    if (preselect) {
      this.projectSelect.value = String(preselect.projectId);
      if (!this.projectInput.value) this.projectInput.value = preselect.projectName;
      await db.setPreference('fc-preselect-project', null);
    }

    root.querySelector('#fctt-toggle')!.addEventListener('click', () => this.toggle());
    root.querySelector('#fctt-log')!.addEventListener('click', () => this.logManual());

    // Auto-fill project name when selecting a linked project
    this.projectSelect.addEventListener('change', () => {
      const selectedId = parseInt(this.projectSelect.value);
      if (selectedId) {
        const project = this.projects.find(p => p.id === selectedId);
        if (project && !this.projectInput.value) {
          this.projectInput.value = project.name;
        }
      }
    });

    wireSharedInputs(root);
    this.renderLog();
  }

  private populateProjectSelect(): void {
    const active = this.projects.filter(p => p.status === 'active');
    this.projectSelect.innerHTML = '<option value="">— None —</option>' +
      active.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  private getSelectedProjectId(): number | undefined {
    const val = this.projectSelect.value;
    return val ? parseInt(val) : undefined;
  }

  private toggle(): void {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  private start(): void {
    this.running = true;
    this.startTime = Date.now() - this.elapsed * 1000;
    db.setPreference('fc-active-timer', {
      project: this.projectInput.value || 'Untitled',
      startTime: this.startTime,
      projectId: this.getSelectedProjectId(),
    });
    this.timerInterval = setInterval(() => {
      this.elapsed = (Date.now() - this.startTime) / 1000;
      this.timerEl.textContent = this.formatTime(this.elapsed);
    }, 100);
    this.updateButton('Stop', true);
  }

  private stop(): void {
    this.running = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    db.setPreference('fc-active-timer', null);
    if (this.elapsed > 0) {
      const entry: TimeEntry = {
        id: Date.now(),
        project: this.projectInput.value || 'Untitled',
        projectId: this.getSelectedProjectId(),
        duration: this.elapsed,
        notes: '',
        date: new Date().toISOString().split('T')[0],
      };
      this.entries.unshift(entry);
      db.putTimeEntry(entry);
      this.renderLog();
    }
    this.elapsed = 0;
    this.timerEl.textContent = '00:00:00';
    this.updateButton('Start', false);
  }

  private logManual(): void {
    const hours = prompt('Enter hours:');
    if (!hours) return;
    const duration = parseFloat(hours) * 3600;
    if (duration > 0) {
      const entry: TimeEntry = {
        id: Date.now(),
        project: this.projectInput.value || 'Untitled',
        projectId: this.getSelectedProjectId(),
        duration,
        notes: '',
        date: new Date().toISOString().split('T')[0],
      };
      this.entries.unshift(entry);
      db.putTimeEntry(entry);
      this.renderLog();
      Toast.success('Entry logged');
    }
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private updateButton(text: string, active: boolean): void {
    const btn = document.getElementById('fctt-toggle');
    if (btn) {
      btn.textContent = text;
      btn.classList.toggle('btn--primary', !active);
      btn.classList.toggle('btn--ghost', active);
    }
  }

  private renderLog(): void {
    const totalSeconds = this.entries.reduce((sum, e) => sum + e.duration, 0);
    this.totalEl.textContent = `Total: ${this.formatDuration(totalSeconds)}`;

    this.logEl.innerHTML = this.entries.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-sm);">No entries yet. Start the timer or log manually.</p>'
      : this.entries.map(e => `
        <div class="fctt-entry">
          <span class="fctt-entry__project">${e.project}</span>
          ${e.projectId ? '<span class="fctt-entry__linked" title="Linked project">◆</span>' : ''}
          <span class="fctt-entry__duration">${this.formatDuration(e.duration)}</span>
          <span class="fctt-entry__date">${e.date}</span>
          <button class="btn btn--ghost btn--sm fctt-invoice" data-id="${e.id}" title="Send to Invoice">↗</button>
          <button class="btn btn--ghost btn--sm fctt-delete" data-id="${e.id}">×</button>
        </div>
      `).join('');

    this.logEl.querySelectorAll('.fctt-delete').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = parseInt((ev.target as HTMLElement).dataset.id!);
        this.entries = this.entries.filter(e => e.id !== id);
        db.deleteTimeEntry(id);
        this.renderLog();
      });
    });

    this.logEl.querySelectorAll('.fctt-invoice').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = parseInt((ev.target as HTMLElement).dataset.id!);
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        const hours = Math.round(entry.duration / 3600 * 100) / 100;
        const items = [{
          description: entry.project || 'Time entry',
          quantity: hours || 1,
          rate: 0,
          projectId: entry.projectId,
        }];
        db.setPreference('fc-pending-invoice-items', items);
        router.navigate('freelance-core', 'invoice-generator');
      });
    });
  }

  destroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
