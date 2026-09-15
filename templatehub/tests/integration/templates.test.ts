/**
 * Integration tests for Templates API
 * Validates end-to-end template system functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_KEY = process.env.TEMPLATEHUB_API_KEY || 'dev-api-key';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  return {
    status: response.status,
    data: await response.json(),
  };
}

describe('Templates API', () => {
  describe('GET /templates', () => {
    it('should return list of templates', async () => {
      const result = await apiCall('/templates');
      expect(result.status).toBe(200);
      expect(result.data.data).toBeInstanceOf(Array);
      expect(result.data.total).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const result = await apiCall('/templates?category=cv');
      expect(result.status).toBe(200);
      expect(result.data.data.every((t: any) => t.category === 'cv')).toBe(true);
    });

    it('should respect limit and offset', async () => {
      const result = await apiCall('/templates?limit=10&offset=0');
      expect(result.status).toBe(200);
      expect(result.data.data.length).toBeLessThanOrEqual(10);
    });

    it('should reject without API key', async () => {
      const response = await fetch(`${API_URL}/api/templates`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /documents/render', () => {
    it('should render document to HTML', async () => {
      const result = await apiCall('/documents/render', {
        method: 'POST',
        body: JSON.stringify({
          templateId: 'apex-ats',
          userData: {
            personalInfo: { fullName: 'Test User', email: 'test@example.com' },
          },
        }),
      });

      expect(result.status).toBe(200);
      expect(result.data.content).toContain('<html>');
      expect(result.data.documentId).toBeDefined();
    });

    it('should require templateId and userData', async () => {
      const result = await apiCall('/documents/render', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(result.status).toBe(400);
    });
  });

  describe('GET /families', () => {
    it('should return template families', async () => {
      const result = await apiCall('/families?product=sumaiya');
      expect(result.status).toBe(200);
      expect(result.data.data).toBeInstanceOf(Array);
      expect(result.data.data.length).toBeGreaterThan(0);
    });
  });
});
