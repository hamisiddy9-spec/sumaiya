// Single shared ApiClient instance for the whole app.
//
// IMPORTANT: there must be exactly one instance. `auth-context` calls
// `apiClient.setAccessToken()` whenever the Supabase session changes; screens
// that `new ApiClient()` for themselves would never receive that token and
// every authenticated request from them would 401.
import { ApiClient } from "@sumaiya/api-client";

export const apiClient = new ApiClient({
  // NEVER default to the raw *.vercel.app URL: this Vercel project has SSO
  // (Vercel Authentication) protection on for everything except custom
  // domains. Every request to sumaiyaai.vercel.app from the app — which has
  // no browser session to satisfy that check — gets an auth challenge
  // instead of the API response, and it fails the exact same way for every
  // endpoint, authenticated or not (confirmed: the public, no-auth /api/jobs
  // feed 401s the same as an authenticated call). A browser only "works"
  // because whoever is testing happens to already be signed into Vercel.
  // templatehub.pro is the real custom domain already attached to this
  // project and bypasses the SSO check. Swap to https://www.templatehub.pro once
  // that domain is bought and attached (see docs/HANDOVER.md).
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://www.templatehub.pro",
  timeout: 30000,
  retryAttempts: 3,
});

export { ApiError } from "@sumaiya/api-client";
