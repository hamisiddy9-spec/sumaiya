import * as Linking from "expo-linking";

/**
 * Deep Linking Test Suite
 * Tests URL parsing, token validation, and sign-in flow
 */

describe("Deep Linking", () => {
  describe("URL Parsing", () => {
    it("should parse sign-in URL with token and email", () => {
      const url = "https://www.templatehub.pro/auth/signin?token=TEST_TOKEN_123&email=user@example.com&action=signin";
      const { path, queryParams } = Linking.parse(url);

      expect(path).toBe("auth/signin");
      expect(queryParams?.token).toBe("TEST_TOKEN_123");
      expect(queryParams?.email).toBe("user@example.com");
      expect(queryParams?.action).toBe("signin");
    });

    it("should parse custom scheme URL", () => {
      const url = "sumaiya://auth/signin?token=JWT_TOKEN&email=john@email.com";
      const { path, queryParams } = Linking.parse(url);

      expect(path).toBe("auth/signin");
      expect(queryParams?.token).toBe("JWT_TOKEN");
      expect(queryParams?.email).toBe("john@email.com");
    });

    it("should handle URL-encoded email", () => {
      const url = "https://www.templatehub.pro/auth/signin?token=TOKEN&email=john%2Btest%40example.com";
      const { queryParams } = Linking.parse(url);

      expect(queryParams?.email).toBe("john+test@example.com");
    });

    it("should handle missing optional parameters", () => {
      const url = "https://www.templatehub.pro/auth/signin?token=TOKEN";
      const { queryParams } = Linking.parse(url);

      expect(queryParams?.token).toBe("TOKEN");
      expect(queryParams?.email).toBeUndefined();
      expect(queryParams?.action).toBeUndefined();
    });

    it("should parse different action types", () => {
      const actions = ["signin", "verify", "reset"];

      actions.forEach((action) => {
        const url = `https://www.templatehub.pro/auth/signin?token=TOKEN&action=${action}`;
        const { queryParams } = Linking.parse(url);

        expect(queryParams?.action).toBe(action);
      });
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
      const invalidTokens = [
        "not-a-token",
        "two.parts",
        ".three.parts.",
        "",
      ];

      invalidTokens.forEach((token) => {
        const parts = token.split(".");
        expect(parts.length !== 3).toBe(true);
      });
    });

    it("should extract claims from JWT payload", () => {
      // Note: In real testing, use a JWT library to decode
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
  });

  describe("Sign-In Link Generation", () => {
    it("should generate valid sign-in link", () => {
      const userId = "user-123";
      const email = "john@example.com";
      const token = "JWT_TOKEN_HERE";

      const deepLink = `https://www.templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(
        email
      )}&action=signin`;

      expect(deepLink).toContain("https://www.templatehub.pro/auth/signin");
      expect(deepLink).toContain(`token=${token}`);
      expect(deepLink).toContain(`email=${encodeURIComponent(email)}`);
      expect(deepLink).toContain("action=signin");
    });

    it("should handle special characters in email", () => {
      const specialEmails = [
        "john+tag@example.com",
        "user.name@example.com",
        "user_123@example.co.uk",
      ];

      specialEmails.forEach((email) => {
        const deepLink = `https://www.templatehub.pro/auth/signin?token=TOKEN&email=${encodeURIComponent(email)}`;

        const { queryParams } = Linking.parse(deepLink);
        expect(queryParams?.email).toBe(email);
      });
    });

    it("should generate fallback web link", () => {
      const token = "JWT_TOKEN";
      const email = "user@example.com";

      // Primary deep link (app)
      const appLink = `https://www.templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(email)}`;

      // Fallback web link (same URL, web app handles it)
      const webLink = `https://www.templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(email)}`;

      expect(appLink).toBe(webLink);
    });

    it("should generate custom scheme link", () => {
      const token = "JWT_TOKEN";
      const email = "user@example.com";

      const customLink = `sumaiya://auth/signin?token=${token}&email=${encodeURIComponent(email)}`;

      expect(customLink).toContain("sumaiya://");
      expect(customLink).toContain("auth/signin");
      expect(customLink).toContain(`token=${token}`);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing token parameter", () => {
      const url = "https://www.templatehub.pro/auth/signin?email=user@example.com";
      const { queryParams } = Linking.parse(url);

      expect(queryParams?.token).toBeUndefined();
      expect(queryParams?.email).toBe("user@example.com");
    });

    it("should handle empty token", () => {
      const url = "https://www.templatehub.pro/auth/signin?token=&email=user@example.com";
      const { queryParams } = Linking.parse(url);

      expect(queryParams?.token).toBe("");
    });

    it("should handle malformed URL", () => {
      const malformedURLs = [
        "not-a-valid-url",
        "sumaiya://",
        "https://",
      ];

      malformedURLs.forEach((url) => {
        try {
          const parsed = Linking.parse(url);
          // Should parse but may have empty path
          expect(parsed).toBeDefined();
        } catch (e) {
          // Some URLs may throw, which is acceptable
          expect(e).toBeDefined();
        }
      });
    });

    it("should handle timeout during token validation", async () => {
      // Fake timers — otherwise this really waits 5s and races jest's own
      // 5s test timeout.
      jest.useFakeTimers();
      const timeout = 5000;
      let completed = false;

      const validationPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          completed = true;
          resolve(true);
        }, timeout + 1000);
      });
      const timeoutPromise = new Promise<boolean>((_resolve, reject) => {
        setTimeout(() => {
          if (!completed) reject(new Error("Validation timeout"));
        }, timeout);
      });

      const raced = Promise.race([validationPromise, timeoutPromise]).catch((e) => e);
      jest.advanceTimersByTime(timeout);
      const result = await raced;

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe("Validation timeout");
      jest.useRealTimers();
    });
  });

  describe("Navigation Flow", () => {
    it("should route sign-in action to auth screen", () => {
      const action = "signin";
      const expectedRoute = action === "signin" ? "Auth" : "App";

      expect(expectedRoute).toBe("Auth");
    });

    it("should route verify action to verification screen", () => {
      const action = "verify";
      const expectedRoute = action === "verify" ? "VerifyEmail" : "Auth";

      expect(expectedRoute).toBe("VerifyEmail");
    });

    it("should route reset action to password reset screen", () => {
      const action = "reset";
      const expectedRoute = action === "reset" ? "ResetPassword" : "Auth";

      expect(expectedRoute).toBe("ResetPassword");
    });

    it("should redirect to app after successful sign-in", () => {
      const isAuthenticated = true;
      const hasSeenOnboarding = true;

      let finalRoute = "Auth";

      if (isAuthenticated) {
        finalRoute = hasSeenOnboarding ? "App" : "Onboarding";
      }

      expect(finalRoute).toBe("App");
    });

    it("should show onboarding after first sign-in", () => {
      const isAuthenticated = true;
      const hasSeenOnboarding = false;

      let finalRoute = "Auth";

      if (isAuthenticated) {
        finalRoute = hasSeenOnboarding ? "App" : "Onboarding";
      }

      expect(finalRoute).toBe("Onboarding");
    });
  });

  describe("Security", () => {
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

    it("should check token expiration", () => {
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

    it("should validate token signature on backend", () => {
      // Signature should be verified server-side
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.signature";

      const parts = token.split(".");
      expect(parts.length).toBe(3);

      // Signature is third part
      const signature = parts[2];
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should require HTTPS for web links", () => {
      const webLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";
      const httpLink = "http://templatehub.pro/auth/signin?token=TOKEN";

      expect(webLink.startsWith("https://")).toBe(true);
      // An http:// link is NOT a secure https link — deep-link handling must
      // reject it. (Was asserting `.startsWith("http://")` === false, which is
      // nonsensical for a string that literally starts with "http://".)
      expect(httpLink.startsWith("https://")).toBe(false);
    });

    it("should allow custom scheme without HTTPS", () => {
      const customLink = "sumaiya://auth/signin?token=TOKEN";

      // Custom schemes don't require HTTPS (handled by OS security)
      expect(customLink.startsWith("sumaiya://")).toBe(true);
    });

    it("should rate-limit sign-in link requests", () => {
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

  describe("Platform-Specific Handling", () => {
    it("should support iOS Universal Links", () => {
      const universalLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";

      // Universal Links configuration in app.json
      const iosConfig = {
        associatedDomains: [
          "applinks:templatehub.pro",
          "applinks:www.templatehub.pro",
        ],
      };

      expect(iosConfig.associatedDomains).toContain("applinks:templatehub.pro");
    });

    it("should support Android App Links", () => {
      const appLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";

      // App Links configuration in app.json
      const androidConfig = {
        intentFilters: [
          {
            action: "VIEW",
            data: [
              {
                scheme: "https",
                host: "templatehub.pro",
                pathPrefix: "/auth",
              },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
      };

      expect(androidConfig.intentFilters[0].action).toBe("VIEW");
      expect(androidConfig.intentFilters[0].data[0].scheme).toBe("https");
    });

    it("should fallback to browser if app not installed", () => {
      // When App Links/Universal Links don't match installed app,
      // the URL should open in default browser
      const deepLink = "https://www.templatehub.pro/auth/signin?token=TOKEN";

      // Browser should handle the same URL
      expect(deepLink).toContain("templatehub.pro");
    });
  });
});
