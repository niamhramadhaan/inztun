/* ═══════════════════════════════════════════════════════
   INDEXEDDB WRAPPER
   Persistent client-side storage
   ═══════════════════════════════════════════════════════ */

const DB_NAME = 'inztun';
const DB_VERSION = 1;

class Database {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
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

  async getStore(storeName, mode = 'readonly') {
    await this.ready;
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Preferences
  async getPreference(key, defaultValue = null) {
    const store = await this.getStore('preferences');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  async setPreference(key, value) {
    const store = await this.getStore('preferences', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // History
  async addHistory(tool, data) {
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

  async getHistory(tool, limit = 50) {
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

  async clearHistory(tool) {
    const store = await this.getStore('history', 'readwrite');
    const index = store.index('tool');
    return new Promise((resolve, reject) => {
      const request = index.openCursor(tool);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
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

  // Saved Items
  async saveItem(tool, name, data) {
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

  async getSavedItems(tool) {
    const store = await this.getStore('saved');
    const index = store.index('tool');
    return new Promise((resolve) => {
      const request = index.getAll(tool);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async deleteSavedItem(id) {
    const store = await this.getStore('saved', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
