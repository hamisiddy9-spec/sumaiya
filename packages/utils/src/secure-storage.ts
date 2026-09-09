// Secure storage wrapper for both web and mobile
// On mobile: uses expo-secure-store
// On web: uses sessionStorage (not truly secure, but adequate for dev)

let SecureStore: any = null;

try {
  // Try to load expo-secure-store if available (mobile)
  SecureStore = require("expo-secure-store");
} catch {
  // Fallback to sessionStorage (web/development)
  console.warn("expo-secure-store not available, using sessionStorage fallback");
  SecureStore = {
    getItemAsync: async (key: string) => {
      if (typeof sessionStorage !== "undefined") {
        return sessionStorage.getItem(key) || null;
      }
      return null;
    },
    setItemAsync: async (key: string, value: string) => {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(key, value);
      }
    },
    deleteItemAsync: async (key: string) => {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(key);
      }
    },
  };
}

export const getSecureStore = () => SecureStore;

export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}
