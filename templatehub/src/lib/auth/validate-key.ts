/**
 * API Key validation
 * Stub implementation - connect to actual key store
 */

export function validateApiKey(apiKey: string): boolean {
  // TODO: Implement
  // 1. Query api_keys table
  // 2. Hash provided key
  // 3. Compare with stored hash
  // 4. Return true if valid

  // Temp: allow development key
  return apiKey === process.env.TEMPLATEHUB_API_KEY;
}

export function getProductFromKey(apiKey: string): string | null {
  // TODO: Query database to get product_id for this key
  return null;
}
