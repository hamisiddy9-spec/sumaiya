import * as SQLite from "expo-sqlite";
import type { CV, SyncQueueItem } from "@sumaiya/types";

const DB_NAME = "sumaiya.db";
const DB_VERSION = 1;

export class OfflineStorage {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error("Failed to initialize offline storage:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cvs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        templateId TEXT NOT NULL,
        title TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        syncedAt INTEGER,
        isOfflineOnly INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        cvId TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL,
        retries INTEGER DEFAULT 0,
        lastError TEXT,
        FOREIGN KEY(cvId) REFERENCES cvs(id)
      );

      CREATE INDEX IF NOT EXISTS idx_cvs_userId ON cvs(userId);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
    `);
  }

  async saveCVOffline(cv: CV): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const stmt = await this.db.prepareAsync(`
      INSERT OR REPLACE INTO cvs
      (id, userId, templateId, title, data, createdAt, updatedAt, isOfflineOnly)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      await stmt.executeAsync(
        cv.id,
        cv.userId,
        cv.templateId,
        cv.title,
        JSON.stringify(cv.data),
        cv.createdAt.getTime(),
        cv.updatedAt.getTime(),
        cv.isOfflineOnly ? 1 : 0
      );
    } finally {
      await stmt.finalizeAsync();
    }
  }

  async getCVOffline(cvId: string): Promise<CV | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync<any>(
      "SELECT * FROM cvs WHERE id = ?",
      [cvId]
    );

    if (!result) return null;

    return {
      id: result.id,
      userId: result.userId,
      templateId: result.templateId,
      title: result.title,
      data: JSON.parse(result.data),
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      syncedAt: result.syncedAt ? new Date(result.syncedAt) : undefined,
      isOfflineOnly: result.isOfflineOnly === 1,
    };
  }

  async getCVsOffline(userId: string): Promise<CV[]> {
    if (!this.db) throw new Error("Database not initialized");

    const results = await this.db.getAllAsync<any>(
      "SELECT * FROM cvs WHERE userId = ? ORDER BY updatedAt DESC",
      [userId]
    );

    return results.map((r) => ({
      id: r.id,
      userId: r.userId,
      templateId: r.templateId,
      title: r.title,
      data: JSON.parse(r.data),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      syncedAt: r.syncedAt ? new Date(r.syncedAt) : undefined,
      isOfflineOnly: r.isOfflineOnly === 1,
    }));
  }

  async deleteCVOffline(cvId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync("DELETE FROM cvs WHERE id = ?", [cvId]);
  }

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const stmt = await this.db.prepareAsync(`
      INSERT OR REPLACE INTO sync_queue
      (id, cvId, operation, data, timestamp, retries, lastError)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      await stmt.executeAsync(
        item.id,
        item.cvId,
        item.operation,
        item.data ? JSON.stringify(item.data) : null,
        item.timestamp,
        item.retries,
        item.lastError || null
      );
    } finally {
      await stmt.finalizeAsync();
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error("Database not initialized");

    const results = await this.db.getAllAsync<any>(
      "SELECT * FROM sync_queue ORDER BY timestamp ASC"
    );

    return results.map((r) => ({
      id: r.id,
      cvId: r.cvId,
      operation: r.operation as "create" | "update" | "delete",
      data: r.data ? JSON.parse(r.data) : null,
      timestamp: r.timestamp,
      retries: r.retries,
      lastError: r.lastError,
    }));
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync("DELETE FROM sync_queue WHERE id = ?", [id]);
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const item = await this.db.getFirstAsync<any>(
      "SELECT * FROM sync_queue WHERE id = ?",
      [id]
    );

    if (!item) return;

    const stmt = await this.db.prepareAsync(`
      UPDATE sync_queue
      SET retries = ?, lastError = ?
      WHERE id = ?
    `);

    try {
      await stmt.executeAsync(
        updates.retries !== undefined ? updates.retries : item.retries,
        updates.lastError !== undefined ? updates.lastError : item.lastError,
        id
      );
    } finally {
      await stmt.finalizeAsync();
    }
  }

  async markCVSynced(cvId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const now = Date.now();
    await this.db.execAsync(
      "UPDATE cvs SET syncedAt = ?, isOfflineOnly = 0 WHERE id = ?",
      [now, cvId]
    );
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync("DELETE FROM sync_queue");
  }
}

export const offlineStorage = new OfflineStorage();
