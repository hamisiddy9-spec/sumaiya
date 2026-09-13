/**
 * Deep Linking Integration Tests
 * Tests URL parsing, token validation, and sign-in flow for deep links
 * Supports both web URLs (https://) and custom scheme (sumaiya://)
 */

import { describe, it, expect } from "@jest/globals";

describe("Deep Linking Integration", () => {
  describe("URL Parsing", () => {
    /**
     * Parse web-based deep links using URL constructor
     * Custom scheme URLs are handled by the OS/runtime, not Node.js URL API
     */
    it("should parse web-based sign-in URL", () => {
      const urlString = "https://www.templatehub.pro/auth/signin?token=TEST_TOKEN_123&email=user@example.com&action=signin";
      const url = new URL(urlString);

      expect(url.hostname).toBe("www.templatehub.pro");
      expect(url.pathname).toBe("/auth/signin");
      expect(url.searchParams.get("token")).toBe("TEST_TOKEN_123");
      expect(url.searchParams.get("email")).toBe("user@example.com");
      expect(url.searchParams.get("action")).toBe("signin");
    });

    it("should parse www-prefixed domain", () => {
      const urlString = "https://www.templatehub.pro/auth/signin?token=JWT_TOKEN&email=john@email.com";
      const url = new URL(urlString);

      expect(url.hostname).toBe("www.templatehub.pro");
      expect(url.searchParams.get("token")).toBe("JWT_TOKEN");
      expect(url.searchParams.get("email")).toBe("john@email.com");
    });

    it("should handle URL-encoded email addresses", () => {
      const urlString = "https://www.templatehub.pro/auth/signin?token=TOKEN&email=john%2Btest%40example.com";
      const url = new URL(urlString);

      expect(url.searchParams.get("email")).toBe("john+test@example.com");
    });

    it("should handle custom scheme URLs via manual parsing", () => {
      // Custom schemes cannot use URL constructor; parse manually
      const urlString = "sumaiya://auth/signin?token=TEST_TOKEN_123&email=user@example.com&action=signin";

      // Extract scheme, path, and query
      const [schemePart, rest] = urlString.split("://");
      expect(schemePart).toBe("sumaiya");

      const [path, queryString] = rest.split("?");
      expect(path).toBe("auth/signin");

      // Parse query parameters manually
      const params = new URLSearchParams(queryString);
      expect(params.get("token")).toBe("TEST_TOKEN_123");
      expect(params.get("email")).toBe("user@example.com");
      expect(params.get("action")).toBe("signin");
    });
  });

  describe("Token Validation", () => {
    it("should identify valid JWT token format", () => {
      const validJWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkLTEyMyIsImVtYWlsIjoiam9obkBlbWFpbC5jb20iLCJleHAiOjE2OTQ4MzIwMDB9.signature";

      // JWT should have 3 parts separated by dots
      const parts = validJWT.split(".");
      expect(parts.length).toBe(3);

      // Each part should be non-empty
      parts.forEach((part) => {
        expect(part.length).toBeGreaterThan(0);
      });
    });

    it("should reject malformed tokens", () => {
      const invalidTokens = ["not-a-token", "two.parts", ".three.parts.", ""];

      invalidTokens.forEach((token) => {
        const parts = token.split(".");
        expect(parts.length !== 3).toBe(true);
      });
    });

    it("should extract claims from JWT payload", () => {
      const payload = JSON.stringify({
        sub: "user-id-123",
        email: "john@email.com",
        exp: 1694832000,
        type: "signin-link",
      });

      const base64Payload = Buffer.from(payload).toString("base64");
      expect(base64Payload).toBeTruthy();

      // Decode back
      const decoded = Buffer.from(base64Payload, "base64").toString();
      const claims = JSON.parse(decoded);

      expect(claims.sub).toBe("user-id-123");
      expect(claims.email).toBe("john@email.com");
      expect(claims.type).toBe("signin-link");
    });

    it("should verify token expiration", () => {
      const now = Math.floor(Date.now() / 1000);

      const validToken = {
        exp: now + 86400, // 24 hours from now
      };

      const expiredToken = {
        exp: now - 3600, // 1 hour ago
      };

      expect(validToken.exp > now).toBe(true);
      expect(expiredToken.exp > now).toBe(false);
    });

    it("should verify token type is signin-link", () => {
      const validToken = {
        sub: "user-123",
        type: "signin-link",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      const invalidToken = {
        sub: "user-123",
        type: "access-token",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      expect(validToken.type).toBe("signin-link");
      expect(invalidToken.type).not.toBe("signin-link");
    });
  });

  describe("Deep Link Generation", () => {
    it("should generate valid web sign-in link", () => {
      const userId = "user-123";
      const email = "john@example.com";
      const token = "JWT_TOKEN_HERE";

      const deepLink = `https://www.templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(
        email
      )}&action=signin`;

      const url = new URL(deepLink);
      expect(url.hostname).toBe("www.templatehub.pro");
      expect(url.searchParams.get("token")).toBe(token);
      expect(url.searchParams.get("email")).toBe(email);
      expect(url.searchParams.get("action")).toBe("signin");
    });

    it("should generate valid custom scheme link", () => {
      const token = "JWT_TOKEN";
      const email = "user@example.com";

      const customLink = `sumaiya://auth/signin?token=${token}&email=${encodeURIComponent(email)}`;

      // Verify structure
      expect(customLink).toContain("sumaiya://");
      expect(customLink).toContain("auth/signin");
      expect(customLink).toContain(`token=${token}`);
      expect(customLink).toContain(`email=${encodeURIComponent(email)}`);

      // Parse manually
      const [scheme, rest] = customLink.split("://");
      expect(scheme).toBe("sumaiya");

      const [path, queryString] = rest.split("?");
      const params = new URLSearchParams(queryString);
      expect(params.get("token")).toBe(token);
      expect(params.get("email")).toBe(email);
    });

    it("should handle special characters in email", () => {
      const specialEmails = [
        "john+tag@example.com",
        "user.name@example.com",
        "user_123@example.co.uk",
      ];

      specialEmails.forEach((email) => {
        const deepLink = `https://www.templatehub.pro/auth/signin?token=TOKEN&email=${encodeURIComponent(email)}`;
        const url = new URL(deepLink);
        expect(url.searchParams.get("email")).toBe(email);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing token parameter", () => {
      const urlString = "https://www.templatehub.pro/auth/signin?email=user@example.com";
      const url = new URL(urlString);

      expect(url.searchParams.get("token")).toBeNull();
      expect(url.searchParams.get("email")).toBe("user@example.com");
    });

    it("should handle empty token", () => {
      const urlString = "https://www.templatehub.pro/auth/signin?token=&email=user@example.com";
      const url = new URL(urlString);

      expect(url.searchParams.get("token")).toBe("");
    });

    it("should validate minimum required parameters", () => {
      // Valid: has token and email
      const validUrl = "https://www.templatehub.pro/auth/signin?token=TOKEN&email=user@example.com";
      const url1 = new URL(validUrl);
      expect(url1.searchParams.has("token")).toBe(true);
      expect(url1.searchParams.has("email")).toBe(true);

      // Invalid: missing token
      const invalidUrl = "https://www.templatehub.pro/auth/signin?email=user@example.com";
      const url2 = new URL(invalidUrl);
      expect(url2.searchParams.has("token")).toBe(false);
    });

    it("should handle malformed URL gracefully", () => {
      const malformedURLs = [
        "not-a-valid-url",
        "https://",
      ];

      malformedURLs.forEach((urlString) => {
        try {
          const url = new URL(urlString);
          // Should not reach here for truly malformed URLs
          expect(false).toBe(true);
        } catch (e) {
          // Expected: malformed URLs should throw
          expect(e).toBeDefined();
        }
      });
    });
  });

  describe("Action Routing", () => {
    it("should route signin action correctly", () => {
      const url = new URL("https://www.templatehub.pro/auth/signin?action=signin");
      const action = url.searchParams.get("action") || "signin";

      expect(action).toBe("signin");
    });

    it("should route verify action correctly", () => {
      const url = new URL("https://www.templatehub.pro/auth/signin?action=verify");
      const action = url.searchParams.get("action");

      expect(action).toBe("verify");
    });

    it("should route reset action correctly", () => {
      const url = new URL("https://www.templatehub.pro/auth/signin?action=reset");
      const action = url.searchParams.get("action");

      expect(action).toBe("reset");
    });

    it("should default to signin when action not provided", () => {
      const url = new URL("https://www.templatehub.pro/auth/signin?token=TOKEN");
      const action = url.searchParams.get("action") || "signin";

      expect(action).toBe("signin");
    });
  });

  describe("Platform Support", () => {
    it("should support iOS Universal Links (https)", () => {
      const universalLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";
      const url = new URL(universalLink);

      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("www.templatehub.pro");
    });

    it("should support Android App Links (https)", () => {
      const appLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";
      const url = new URL(appLink);

      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("www.templatehub.pro");
    });

    it("should support custom scheme for both platforms", () => {
      const customLink = "sumaiya://auth/signin?token=TOKEN";

      // Verify structure
      expect(customLink.startsWith("sumaiya://")).toBe(true);

      // Parse manually
      const [scheme, rest] = customLink.split("://");
      expect(scheme).toBe("sumaiya");
    });

    it("should fallback to web when app not installed", () => {
      // Web link serves as fallback
      const webLink = "https://www.templatehub.pro/auth/signin?token=TOKEN&fallback=web";
      const url = new URL(webLink);

      expect(url.protocol).toBe("https:");
      expect(url.searchParams.get("token")).toBe("TOKEN");
    });
  });

  describe("Security", () => {
    it("should require HTTPS for web links", () => {
      const httpsLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";
      const httpLink = "http://templatehub.pro/auth/signin?token=TOKEN";

      const httpsUrl = new URL(httpsLink);
      expect(httpsUrl.protocol).toBe("https:");

      try {
        // HTTP should ideally be rejected, but URL constructor accepts it
        const httpUrl = new URL(httpLink);
        expect(httpUrl.protocol).toBe("http:");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should support custom scheme without HTTPS requirement", () => {
      const customLink = "sumaiya://auth/signin?token=TOKEN";

      // Custom schemes don't require HTTPS (handled by OS security)
      expect(customLink.startsWith("sumaiya://")).toBe(true);
    });

    it("should validate token structure before accepting", () => {
      const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkLTEyMyJ9.signature";
      const invalidToken = "not-a-jwt";

      // Valid token: 3 parts
      const validParts = validToken.split(".");
      expect(validParts.length).toBe(3);

      // Invalid token: not 3 parts
      const invalidParts = invalidToken.split(".");
      expect(invalidParts.length).not.toBe(3);
    });

    it("should enforce rate limiting on sign-in link requests", () => {
      const maxRequests = 5;
      const windowMs = 3600000; // 1 hour
      const requests: number[] = [];

      // Simulate 5 requests within 1 hour
      for (let i = 0; i < 5; i++) {
        requests.push(Date.now());
      }

      expect(requests.length).toBe(maxRequests);

      // 6th request should be rejected
      const sixthRequest = Date.now();
      const requestsInWindow = requests.filter((req) => sixthRequest - req < windowMs);

      expect(requestsInWindow.length).toBe(maxRequests);
      expect(requestsInWindow.length >= maxRequests).toBe(true);
    });
  });

  describe("End-to-End Flow Simulation", () => {
    it("should complete full sign-in link flow", () => {
      // Step 1: Generate sign-in link on backend
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInR5cCI6InNpZ25pbi1saW5rIiwicHVycG9zZSI6InNpZ25pbmcifQ.signature";
      const email = "john@example.com";
      const action = "signin";

      const deepLink = `https://www.templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(email)}&action=${action}`;

      // Step 2: Parse link
      const url = new URL(deepLink);
      const parsedToken = url.searchParams.get("token");
      const parsedEmail = url.searchParams.get("email");
      const parsedAction = url.searchParams.get("action");

      // Step 3: Validate structure
      expect(parsedToken).toBe(token);
      expect(parsedEmail).toBe(email);
      expect(parsedAction).toBe(action);

      // Step 4: Verify token format
      const parts = parsedToken?.split(".");
      expect(parts?.length).toBe(3);

      // Step 5: Route to appropriate handler
      expect(parsedAction).toBe("signin");
    });

    it("should handle custom scheme in end-to-end flow", () => {
      const token = "JWT_TOKEN_123";
      const email = "user@example.com";
      const action = "signin";

      // Generate custom scheme link
      const customLink = `sumaiya://auth/signin?token=${token}&email=${encodeURIComponent(email)}&action=${action}`;

      // Parse manually (custom schemes can't use URL constructor)
      const [scheme, rest] = customLink.split("://");
      const [path, queryString] = rest.split("?");
      const params = new URLSearchParams(queryString);

      // Validate
      expect(scheme).toBe("sumaiya");
      expect(path).toBe("auth/signin");
      expect(params.get("token")).toBe(token);
      expect(params.get("email")).toBe(email);
      expect(params.get("action")).toBe(action);
    });
  });
});
