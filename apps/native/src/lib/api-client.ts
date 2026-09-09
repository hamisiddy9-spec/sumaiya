// Single shared ApiClient instance for the whole app.
//
// IMPORTANT: there must be exactly one instance. `auth-context` calls
// `apiClient.setAccessToken()` whenever the Supabase session changes; screens
// that `new ApiClient()` for themselves would never receive that token and
// every authenticated request from them would 401.
import { ApiClient } from "@sumaiya/api-client";

export const apiClient = new ApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://sumaiyaai.vercel.app",
  timeout: 30000,
  retryAttempts: 3,
});

export { ApiError } from "@sumaiya/api-client";
