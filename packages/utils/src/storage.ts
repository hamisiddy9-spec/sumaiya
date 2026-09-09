// Cross-platform storage abstraction (web localStorage / mobile AsyncStorage)

export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Web storage adapter (wraps localStorage).
 */
export class WebStorageAdapter implements IStorage {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

/**
 * Mobile storage adapter (for React Native AsyncStorage).
 * Injected at runtime.
 */
export class MobileStorageAdapter implements IStorage {
  constructor(private asyncStorage: any) {}

  async getItem(key: string): Promise<string | null> {
    return this.asyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.asyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.asyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    return this.asyncStorage.clear();
  }
}

/**
 * Helper to get appropriate storage for platform.
 */
export function getStorage(): IStorage {
  if (typeof localStorage !== "undefined") {
    return new WebStorageAdapter();
  }

  // Return null storage for server-side (will throw on access)
  return {
    async getItem(): Promise<null> {
      throw new Error("Storage not available");
    },
    async setItem(): Promise<void> {
      throw new Error("Storage not available");
    },
    async removeItem(): Promise<void> {
      throw new Error("Storage not available");
    },
    async clear(): Promise<void> {
      throw new Error("Storage not available");
    },
  };
}
