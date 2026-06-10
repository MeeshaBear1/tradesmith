# Tradesmith — Native app (iOS / Android)

The native apps are a **Capacitor shell** around the live web app. The shell loads
`https://tradesmith-nu.vercel.app` (see `capacitor.config.ts` → `server.url`), so the
native binary is the same battle-tested product — and **every web redeploy updates the
app instantly**, with no app-store resubmission for web changes.

> For tomorrow's demo to your roofing friends, use the **installable PWA** (open the URL
> on a phone → *Add to Home Screen*). The native store binaries below are the *next* step —
> they need developer accounts + review and can't be live same-day.

## Android (works on Windows)
Prereqs: Android Studio + JDK 17.
```
npm install
npx cap add android
npx cap sync android
npx cap open android      # opens Android Studio → Run on a device/emulator
```

## iOS (requires a Mac + Xcode)
```
npm install
npx cap add ios
npx cap sync ios
npx cap open ios          # opens Xcode → Run on a simulator/device
```

## Shipping to the stores
- **Apple App Store:** Apple Developer Program ($99/yr), then Archive in Xcode → upload to
  App Store Connect → TestFlight / review (typically a few days).
- **Google Play:** Play Console ($25 one-time), then build a signed AAB in Android Studio →
  upload → review.
- App icon + splash: drop a 1024² PNG and run `npx @capacitor/assets generate`.

## Why a server-URL shell (not a static export)
Tradesmith is a server app (auth cookies, server components, API routes, Stripe webhooks).
A static export would drop those. The `server.url` shell keeps the full product and gives
instant OTA-style updates. If you later want true offline-native, we'd add Capacitor
plugins (Camera, Filesystem, Push) and a synced local cache.
