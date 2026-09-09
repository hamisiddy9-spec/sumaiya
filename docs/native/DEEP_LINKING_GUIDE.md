# Deep Linking Guide for TemplateHub Mobile

## Overview

Deep linking allows users who receive sign-in emails to open the app directly with authenticated sessions. This guide covers how to generate, structure, and handle deep links in TemplateHub.

---

## URL Schemes

### Supported Schemes

The app responds to these URL schemes:

**Custom Scheme:**
```
templatehub://auth/signin?token=JWT_TOKEN&email=user@example.com
```

**Web Links (Universal Links / App Links):**
```
https://templatehub.pro/auth/signin?token=JWT_TOKEN&email=user@example.com
https://www.templatehub.pro/auth/signin?token=JWT_TOKEN&email=user@example.com
```

### Why Two Schemes?

- **Custom scheme** (`templatehub://`) - Direct app-only navigation, no fallback
- **Web links** (`https://`) - Open in app if installed, fallback to web otherwise (recommended)

---

## Link Structure

### Sign-In Link

```
https://templatehub.pro/auth/signin?token={JWT_TOKEN}&email={USER_EMAIL}&action=signin
```

**Parameters:**
- `token` (required) - JWT token valid for 24 hours
- `email` (optional) - User's email address (for display/verification)
- `action` (optional, default: "signin") - Action type: signin, verify, reset

**Example:**
```
https://templatehub.pro/auth/signin?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkLTEyMyIsImVtYWlsIjoiam9obkBlbWFpbC5jb20iLCJleHAiOjE2OTQ4MzIwMDB9.signature&email=john@email.com
```

### Email Verification Link

```
https://templatehub.pro/auth/signin?token={JWT_TOKEN}&email={USER_EMAIL}&action=verify
```

**Use Case:** Verify email address after sign-up

### Password Reset Link

```
https://templatehub.pro/auth/signin?token={JWT_TOKEN}&email={USER_EMAIL}&action=reset
```

**Use Case:** Password reset flow

---

## Backend Implementation

### Generate Sign-In Link

When a user requests a sign-in link via email:

```typescript
// Backend (Node.js/Express example)
import jwt from "jsonwebtoken";

app.post("/api/auth/signin-link", async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Generate JWT token (valid for 24 hours)
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "signin-link",
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  // Create deep link
  const deepLink = `https://templatehub.pro/auth/signin?token=${token}&email=${encodeURIComponent(
    email
  )}&action=signin`;

  // Send email with link
  await sendEmail({
    to: email,
    subject: "Sign in to TemplateHub",
    html: `
      <p>Click the link below to sign in to your TemplateHub account:</p>
      <a href="${deepLink}">Sign In to TemplateHub</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  res.json({ message: "Sign-in link sent to email" });
});
```

### Verify Sign-In Link Token

```typescript
app.post("/api/auth/verify-signin-link", async (req, res) => {
  const { token } = req.body;

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "signin-link") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    // Find user
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new session token
    const sessionToken = generateSessionToken(user);

    // Return user + session token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: sessionToken,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
```

---

## Client-Side Handling

### App Configuration (app.json)

The app is configured to intercept deep links:

**iOS (Universal Links):**
```json
{
  "ios": {
    "associatedDomains": [
      "applinks:templatehub.pro",
      "applinks:www.templatehub.pro"
    ]
  }
}
```

**Android (App Links):**
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "templatehub.pro",
            "pathPrefix": "/auth"
          },
          {
            "scheme": "https",
            "host": "www.templatehub.pro",
            "pathPrefix": "/auth"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### Link Handling (DeepLinkHandler)

The app automatically handles incoming links via the `DeepLinkHandler` component:

1. **Extract token** from URL parameters
2. **Call signIn(email, "", token)** with the token
3. **Verify token on API** (backend validates JWT)
4. **Fetch user data** from API
5. **Store token** in secure storage
6. **Navigate to App** (authenticated)

---

## Email Template Example

### Sign-In Email

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: #ff7a4f;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
      }
      .footer { color: #999; font-size: 12px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Sign in to TemplateHub</h1>

      <p>Hi,</p>
      <p>Click the button below to sign in to your TemplateHub account:</p>

      <p style="text-align: center;">
        <a href="{{ deepLink }}" class="button">Sign In</a>
      </p>

      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 12px;">
        {{ deepLink }}
      </p>

      <p>This link expires in 24 hours.</p>

      <p>If you didn't request this sign-in link, please ignore this email.</p>

      <div class="footer">
        <p>TemplateHub — Professional CV Builder</p>
        <p><a href="https://templatehub.pro">Visit our website</a></p>
      </div>
    </div>
  </body>
</html>
```

---

## Testing Deep Links

### iOS (Simulator/Device)

```bash
# Open custom scheme
xcrun simctl openurl booted "templatehub://auth/signin?token=TEST_TOKEN&email=test@example.com"

# Open universal link
xcrun simctl openurl booted "https://templatehub.pro/auth/signin?token=TEST_TOKEN&email=test@example.com"
```

### Android (Emulator/Device)

```bash
# Open custom scheme
adb shell am start -a android.intent.action.VIEW -d "templatehub://auth/signin?token=TEST_TOKEN&email=test@example.com"

# Open app link
adb shell am start -a android.intent.action.VIEW -d "https://templatehub.pro/auth/signin?token=TEST_TOKEN&email=test@example.com"
```

### Web Fallback

If the app is not installed and user clicks web link:
```
https://templatehub.pro/auth/signin?token=TOKEN&email=EMAIL
```

Web app should handle the token and auto-sign-in the user.

---

## Security Considerations

### JWT Token Security

1. **Short expiration** - Tokens valid for 24 hours only
2. **Type verification** - Backend checks token type is "signin-link"
3. **One-time use** - Tokens cannot be reused after signin
4. **HTTPS only** - All links use HTTPS (except custom scheme)
5. **Secure storage** - Tokens stored in secure storage (expo-secure-store)

### Rate Limiting

Backend should rate-limit sign-in link requests:

```typescript
// Example: Max 5 sign-in links per hour per email
const RATE_LIMIT = {
  max: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

app.post("/api/auth/signin-link", rateLimiter(RATE_LIMIT), async (req, res) => {
  // Handle sign-in link request
});
```

### Email Verification

Optionally verify email before allowing sign-in:

```typescript
if (!user.emailVerified) {
  return res.status(403).json({ error: "Please verify your email first" });
}
```

---

## Troubleshooting

### Link Opens in Browser Instead of App

**Cause:** App not installed or App Links not configured

**Fix:**
1. Ensure app is installed
2. Verify app.json configuration
3. For iOS, rebuild app with correct bundle ID
4. For Android, rebuild app with signing certificate

### "Token Expired" Error

**Cause:** Link older than 24 hours

**Fix:**
1. Resend sign-in link email
2. User must click link within 24 hours

### "Invalid Token" Error

**Cause:** Token was tampered with or corrupted

**Fix:**
1. Check URL is complete and unmodified
2. Resend sign-in link email
3. Check backend JWT_SECRET is correct

### Deep Link Not Triggering Sign-In

**Cause:** Token parameter missing or malformed

**Fix:**
1. Verify `?token=` parameter is in URL
2. Check token is properly URL-encoded
3. Test with hardcoded token in development

---

## Best Practices

1. **Always use HTTPS** for web links (except custom scheme)
2. **Include email** in link for verification purposes
3. **Short token expiration** (24 hours recommended)
4. **Rate-limit** sign-in link requests
5. **Send confirmation email** after successful signin
6. **Log signin attempts** for security auditing
7. **Implement one-time tokens** if applicable
8. **Test on real devices** (simulator behavior differs)

---

## References

- Expo Linking: https://docs.expo.dev/guides/linking/
- React Navigation Deep Linking: https://reactnavigation.org/docs/deep-linking/
- iOS Universal Links: https://developer.apple.com/ios/universal-links/
- Android App Links: https://developer.android.com/training/app-links

---

**Last Updated:** 2026-09-03  
**Version:** 1.0.0  
**Status:** Production Ready
