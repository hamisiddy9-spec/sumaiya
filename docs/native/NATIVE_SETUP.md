# TemplateHub Native App - Setup & Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Building for iOS](#building-for-ios)
3. [Building for Android](#building-for-android)
4. [Deploying to App Store](#deploying-to-app-store)
5. [Deploying to Google Play](#deploying-to-google-play)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Expo CLI: `npm install -g eas-cli`
- iOS: Xcode 15+ and CocoaPods (macOS only)
- Android: Android Studio, NDK, and emulator

### Installation

```bash
# Install dependencies
npm install

# Set environment variables
export EXPO_PUBLIC_API_URL="https://api.templatehub.pro"
export EAS_BUILD_PROFILE="preview"

# Start the development server
npm start

# For iOS simulator
npm run ios

# For Android emulator
npm run android

# For web preview
npm run web
```

### Environment Configuration

Create `.env.local`:
```
EXPO_PUBLIC_API_URL=https://api.templatehub.pro
EXPO_PUBLIC_SUMAIYA_API_KEY=your_key_here
```

## Building for iOS

### Setup

1. **Configure Apple Credentials**
   ```bash
   eas credentials
   ```

2. **Configure Provisioning Profiles**
   - App ID: `com.templatehub.mobile`
   - Capabilities: Camera, Photo Library, Push Notifications
   - Signing certificates: Distribution certificate for App Store

### Build

```bash
# Build for Apple TestFlight (internal)
eas build --platform ios --profile preview

# Build for App Store (production)
eas build --platform ios --profile production
```

### Submit

```bash
# Submit to App Store
eas submit --platform ios

# Or manually via Transporter
# Build exports to .ipa file
```

## Building for Android

### Setup

1. **Generate Upload Keystore**
   ```bash
   eas credentials
   # Choose "Create a new Keystore"
   ```

2. **Configure App Signing**
   - Package name: `com.templatehub.mobile`
   - Version code: auto-incremented
   - Min SDK: 26, Target SDK: 35

### Build

```bash
# Build for Google Play internal testing
eas build --platform android --profile preview

# Build for Google Play production
eas build --platform android --profile production
```

### Submit

```bash
# Submit to Google Play
eas submit --platform android

# Or manually via Google Play Console
# Build exports to .aab (App Bundle)
```

## Deploying to App Store

### Prerequisites
- Apple Developer Account (99 USD/year)
- App Store Connect access
- Bundle ID: `com.templatehub.mobile`

### Steps

1. **Create App Record**
   - Go to App Store Connect
   - Create new iOS App
   - Name: TemplateHub
   - Bundle ID: com.templatehub.mobile
   - Category: Productivity

2. **Prepare App**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit**
   ```bash
   eas submit --platform ios --id <BUILD_ID>
   ```

4. **Review & Approve**
   - Wait for app review (typically 24-48 hours)
   - Fix any issues from review
   - Resubmit if needed

5. **Release**
   - Approve for release in App Store Connect
   - Choose phased release or immediate full release

### Marketing Materials Needed
- App description (4000 chars max)
- Keywords (30 chars, comma-separated)
- Screenshots (6 minimum, all device sizes)
- App icon (1024x1024 PNG)
- Privacy policy URL

## Deploying to Google Play

### Prerequisites
- Google Play Developer Account (25 USD one-time)
- Google Play Console access
- Package name: `com.templatehub.mobile`

### Steps

1. **Create App Record**
   - Go to Google Play Console
   - Create new app
   - Name: TemplateHub
   - Default language: English
   - App category: Productivity

2. **Prepare App**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit**
   ```bash
   eas submit --platform android --id <BUILD_ID>
   ```

4. **Review & Approve**
   - Submit for review
   - Wait for review (typically 4-24 hours)
   - Address any issues

5. **Release**
   - Complete store listing
   - Upload privacy policy
   - Set countries and regions
   - Choose rollout (staged or full)

### Marketing Materials Needed
- App description (4000 chars)
- Short description (80 chars)
- Screenshots (5-8 per device type)
- Feature graphic (1024x500 PNG)
- App icon (512x512 PNG)
- Privacy policy URL

## Version Management

### Versioning Scheme
- `MAJOR.MINOR.PATCH`
- Example: `1.0.0`, `1.1.0`, `1.1.1`

### Update Version
```bash
# Update in app.json
{
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "1.1.0"
    },
    "android": {
      "versionCode": 11
    }
  }
}
```

## Monitoring & Analytics

### Setup Analytics
```bash
# Configure PostHog for mobile analytics
# In app.json, add:
{
  "extra": {
    "posthog": {
      "apiKey": "your-posthog-key",
      "apiHost": "https://posthog.templatehub.pro"
    }
  }
}
```

### Enable Crash Reporting
```bash
# Configure Sentry for crash reporting
npm install @sentry/react-native

# In app.tsx
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/12345",
});
```

## Troubleshooting

### Build Fails on Certificate
```bash
# Clear cached credentials
eas credentials --clear

# Regenerate certificates
eas credentials
```

### Build Size Too Large
```bash
# Profile bundle size
npx expo-bundle-analyzer

# Reduce assets
# Remove unused fonts/icons
# Optimize images
```

### App Crashes on Launch
```bash
# Check logs
eas build:view --platform ios
eas build:view --platform android

# Debug locally
npm run ios -- --verbose
npm run android -- --verbose
```

### Camera Permissions Not Working
```bash
# Verify app.json has camera usage description
# iOS: NSCameraUsageDescription
# Android: android.permission.CAMERA

# Test on physical device
npm run ios -- -i
npm run android -- device
```

## Continuous Integration

### GitHub Actions Setup

`.github/workflows/mobile-build.yml`
```yaml
name: Mobile Build & Deploy

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: eas build --platform all --profile preview
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Performance Targets

- Launch time: < 3 seconds
- Home screen load: < 1 second
- CV scan: < 10 seconds
- Template picker: < 2 seconds
- PDF export: < 5 seconds

## Security Checklist

- [ ] Secure storage for tokens (expo-secure-store)
- [ ] No hardcoded API keys or secrets
- [ ] HTTPS only for API calls
- [ ] SSL certificate pinning (optional)
- [ ] User data encryption at rest
- [ ] Privacy policy published
- [ ] Terms of service published

## Support & Resources

- Expo docs: https://docs.expo.dev
- React Native docs: https://reactnative.dev
- EAS docs: https://docs.expo.dev/build/setup
- App Store review guidelines: https://developer.apple.com/app-store/review/guidelines
- Google Play policies: https://play.google.com/about/developer-content-policy

---

**Last Updated:** 2026-09-03  
**Version:** 1.0.0  
**Maintainers:** Claude (Haiku 4.5), Hermes AI Agent
