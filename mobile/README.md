# EcoCash Investment Mobile

The Android/iOS app is a native Expo shell around the existing EcoCash Investment frontend. This preserves the live web app's authentication, payments, investment, admin, and notification behaviour while delivering it as an installable mobile app.

## Set up

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_APP_URL` to the **HTTPS production URL** of the existing client.
4. Start the app with `npm run android` or `npm run ios`.

Use a publicly reachable HTTPS URL. A phone cannot load a deployment address such as `localhost`.

## Build releases

Install and sign in to Expo Application Services, then use EAS Build to produce signed Android and iOS store packages:

```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

## App icon

The supplied EcoCash Cryptocurrency Investment image is configured as `assets/icon.png`. It is a 1024×1024 PNG, ready for Android and iOS builds.
