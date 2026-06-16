const DB_NAME = 'inztun';
const DB_VERSION = 5;

export interface Project {
  id: number;
  clientId: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  budget?: number;
  currency?: string;
  deadline?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  clientId?: number;
  projectId?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntry {
  id: number;
  project: string;
  projectId?: number;
  duration: number;
  notes: string;
  date: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  projectId?: number;
  date: string;
}

export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Activity {
  id: number;
  type: string;
  label: string;
  meta?: string;
  createdAt: number;
}

class Database {
  private db: IDBDatabase | null = null;
  ready: Promise<IDBDatabase>;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('tool', 'tool', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('saved')) {
          const savedStore = db.createObjectStore('saved', { keyPath: 'id', autoIncrement: true });
          savedStore.createIndex('tool', 'tool', { unique: false });
          savedStore.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('timeEntries')) {
          const te = db.createObjectStore('timeEntries', { keyPath: 'id' });
          te.createIndex('project', 'project', { unique: false });
          te.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          const ex = db.createObjectStore('expenses', { keyPath: 'id' });
          ex.createIndex('category', 'category', { unique: false });
          ex.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('clients')) {
          const cl = db.createObjectStore('clients', { keyPath: 'id' });
          cl.createIndex('status', 'status', { unique: false });
          cl.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('projects')) {
          const pj = db.createObjectStore('projects', { keyPath: 'id' });
          pj.createIndex('clientId', 'clientId', { unique: false });
          pj.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const nt = db.createObjectStore('notes', { keyPath: 'id' });
          nt.createIndex('clientId', 'clientId', { unique: false });
          nt.createIndex('projectId', 'projectId', { unique: false });
          nt.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('activity')) {
          const ac = db.createObjectStore('activity', { keyPath: 'id' });
          ac.createIndex('type', 'type', { unique: false });
          ac.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Add projectId index to existing stores on upgrade
        if (event.oldVersion < 3) {
          try {
            const teStore = (event.target as IDBOpenDBRequest).transaction!.objectStore('timeEntries');
            if (!teStore.indexNames.contains('projectId')) {
              teStore.createIndex('projectId', 'projectId', { unique: false });
            }
            const exStore = (event.target as IDBOpenDBRequest).transaction!.objectStore('expenses');
            if (!exStore.indexNames.contains('projectId')) {
              exStore.createIndex('projectId', 'projectId', { unique: false });
            }
          } catch (e) {
            console.warn('DB upgrade: could not add projectId indexes', e);
          }
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.ready;
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async getPreference(key: string, defaultValue: unknown = null): Promise<unknown> {
    const store = await this.getStore('preferences');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  async setPreference(key: string, value: unknown): Promise<void> {
    const store = await this.getStore('preferences', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addHistory(tool: string, data: unknown): Promise<IDBValidKey> {
    const store = await this.getStore('history', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({
        tool,
        data,
        timestamp: Date.now(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getHistory(tool: string, limit = 50): Promise<Array<{ id: IDBValidKey; tool: string; data: unknown; timestamp: number }>> {
    const store = await this.getStore('history');
    const index = store.index('tool');
    return new Promise((resolve) => {
      const request = index.getAll(tool);
      request.onsuccess = () => {
        const results = request.result
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  }

  async clearHistory(tool: string): Promise<void> {
    const store = await this.getStore('history', 'readwrite');
    const index = store.index('tool');
    return new Promise((resolve, reject) => {
      const request = index.openCursor(tool);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveItem(tool: string, name: string, data: unknown): Promise<IDBValidKey> {
    const store = await this.getStore('saved', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({
        tool,
        name,
        data,
        createdAt: Date.now(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSavedItems(tool: string): Promise<Array<{ id: IDBValidKey; tool: string; name: string; data: unknown; createdAt: number }>> {
    const store = await this.getStore('saved');
    const index = store.index('tool');
    return new Promise((resolve) => {
      const request = index.getAll(tool);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async deleteSavedItem(id: IDBValidKey): Promise<void> {
    const store = await this.getStore('saved', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async trackToolUse(toolId: string): Promise<void> {
    const usage = (await this.getPreference('toolUsage', {})) as Record<string, number>;
    usage[toolId] = (usage[toolId] || 0) + 1;
    await this.setPreference('toolUsage', usage);
  }

  async getToolUsage(): Promise<Record<string, number>> {
    return (await this.getPreference('toolUsage', {})) as Record<string, number>;
  }

  // Time Entries
  async getAllTimeEntries(): Promise<TimeEntry[]> {
    const store = await this.getStore('timeEntries');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.id - a.id));
      request.onerror = () => resolve([]);
    });
  }

  async putTimeEntry(entry: TimeEntry): Promise<void> {
    const store = await this.getStore('timeEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTimeEntry(id: number): Promise<void> {
    const store = await this.getStore('timeEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Expenses
  async getAllExpenses(): Promise<Expense[]> {
    const store = await this.getStore('expenses');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.id - a.id));
      request.onerror = () => resolve([]);
    });
  }

  async putExpense(entry: Expense): Promise<void> {
    const store = await this.getStore('expenses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExpense(id: number): Promise<void> {
    const store = await this.getStore('expenses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clients
  async getAllClients(): Promise<Client[]> {
    const store = await this.getStore('clients');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.id - a.id));
      request.onerror = () => resolve([]);
    });
  }

  async putClient(client: Client): Promise<void> {
    const store = await this.getStore('clients', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteClient(id: number): Promise<void> {
    const store = await this.getStore('clients', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Projects
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const full: Project = {
      ...project,
      id: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const store = await this.getStore('projects', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = store.add(full);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return full;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const store = await this.getStore('projects');
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const store = await this.getStore('projects');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => resolve([]);
    });
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    const store = await this.getStore('projects');
    const index = store.index('clientId');
    return new Promise((resolve) => {
      const request = index.getAll(clientId);
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => resolve([]);
    });
  }

  async updateProject(project: Project): Promise<void> {
    project.updatedAt = Date.now();
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: number): Promise<void> {
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Notes
  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const full: Note = {
      ...note,
      id: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const store = await this.getStore('notes', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = store.add(full);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return full;
  }

  async getNote(id: number): Promise<Note | undefined> {
    const store = await this.getStore('notes');
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });
  }

  async getAllNotes(): Promise<Note[]> {
    const store = await this.getStore('notes');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => resolve([]);
    });
  }

  async getNotesByClient(clientId: number): Promise<Note[]> {
    const store = await this.getStore('notes');
    const index = store.index('clientId');
    return new Promise((resolve) => {
      const request = index.getAll(clientId);
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => resolve([]);
    });
  }

  async getNotesByProject(projectId: number): Promise<Note[]> {
    const store = await this.getStore('notes');
    const index = store.index('projectId');
    return new Promise((resolve) => {
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => resolve([]);
    });
  }

  async updateNote(note: Note): Promise<void> {
    note.updatedAt = Date.now();
    const store = await this.getStore('notes', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(id: number): Promise<void> {
    const store = await this.getStore('notes', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Activity
  async logActivity(type: string, label: string, meta?: string): Promise<void> {
    const entry: Activity = { id: Date.now(), type, label, meta, createdAt: Date.now() };
    const store = await this.getStore('activity', 'readwrite');
    store.add(entry);
  }

  async getRecentActivity(limit = 10): Promise<Activity[]> {
    const store = await this.getStore('activity');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit));
      request.onerror = () => resolve([]);
    });
  }

  private async getAllFromStore(storeName: string): Promise<unknown[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportAll(): Promise<string> {
    const [preferences, history, saved, timeEntries, expenses, clients, projects, notes, activity] = await Promise.all([
      this.getAllFromStore('preferences'),
      this.getAllFromStore('history'),
      this.getAllFromStore('saved'),
      this.getAllFromStore('timeEntries'),
      this.getAllFromStore('expenses'),
      this.getAllFromStore('clients'),
      this.getAllFromStore('projects'),
      this.getAllFromStore('notes'),
      this.getAllFromStore('activity'),
    ]);
    return JSON.stringify({ preferences, history, saved, timeEntries, expenses, clients, projects, notes, activity, exportedAt: Date.now(), version: DB_VERSION });
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json);
    const stores = ['preferences', 'history', 'saved', 'timeEntries', 'expenses', 'clients', 'projects', 'notes', 'activity'] as const;

    for (const storeName of stores) {
      const items = data[storeName];
      if (!Array.isArray(items) || items.length === 0) continue;
      await this.clearStore(storeName);
      const store = await this.getStore(storeName, 'readwrite');
      await Promise.all(items.map(item => new Promise<void>((resolve, reject) => {
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })));
    }
  }
}

export const db = new Database();
