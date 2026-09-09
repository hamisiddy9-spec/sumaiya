// API Client — shared across web and mobile
// Handles auth, CV CRUD, template fetching, and sync coordination

import type { CV, CVData, AuthUser, Template, SyncQueueItem, Lang } from "@sumaiya/types";

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private accessToken?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Auth
  async signUp(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    return this.request<{ user: AuthUser; token: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signIn(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    return this.request<{ user: AuthUser; token: string }>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>("/api/auth/me");
  }

  async signOut(): Promise<void> {
    await this.request<void>("/api/auth/signout", { method: "POST" });
    this.accessToken = undefined;
  }

  // CV CRUD
  async listCVs(): Promise<CV[]> {
    return this.request<CV[]>("/api/cvs");
  }

  async getCV(id: string): Promise<CV> {
    return this.request<CV>(`/api/cvs/${id}`);
  }

  async createCV(data: Partial<CV>): Promise<CV> {
    return this.request<CV>("/api/cvs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCV(id: string, data: Partial<CV>): Promise<CV> {
    return this.request<CV>(`/api/cvs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCV(id: string): Promise<void> {
    await this.request<void>(`/api/cvs/${id}`, { method: "DELETE" });
  }

  // Templates
  async getTemplates(lang: Lang = "en"): Promise<Template[]> {
    return this.request<Template[]>(`/api/templates?lang=${lang}`);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/api/templates/${id}`);
  }

  // OCR (mobile-specific)
  async ocrUpload(file: Blob, lang: Lang = "en"): Promise<Partial<CVData>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lang", lang);

    return this.request<Partial<CVData>>("/api/mobile/ocr", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set multipart boundary
    });
  }

  // Sync (offline-aware)
  async syncQueue(items: SyncQueueItem[]): Promise<{ synced: string[]; failed: string[] }> {
    return this.request<{ synced: string[]; failed: string[] }>("/api/sync", {
      method: "POST",
      body: JSON.stringify(items),
    });
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await this.request<void>("/api/health", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}

export default ApiClient;
