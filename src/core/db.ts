const DB_NAME = 'inztun';
const DB_VERSION = 1;

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
}

export const db = new Database();
