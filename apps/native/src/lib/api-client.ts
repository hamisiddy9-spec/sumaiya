// Single shared ApiClient instance for the whole app.
//
// IMPORTANT: there must be exactly one instance. `auth-context` calls
// `apiClient.setAccessToken()` whenever the Supabase session changes; screens
// that `new ApiClient()` for themselves would never receive that token and
// every authenticated request from them would 401.
import { ApiClient } from "@sumaiya/api-client";

/**
 * The one place the backend host is decided.
 *
 * NEVER default to the raw *.vercel.app URL: this Vercel project has SSO
 * (Vercel Authentication) protection on for everything except custom domains.
 * Every request to the vercel.app host from the app — which has no browser
 * session to satisfy that check — gets an auth challenge instead of the API
 * response, and it fails the same way for every endpoint, authenticated or not.
 * www.templatehub.pro is the canonical custom domain attached to this project
 * and bypasses the check.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://www.templatehub.pro";

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  timeout: 30000,
  retryAttempts: 3,
});

export { ApiError } from "@sumaiya/api-client";
