# Tradesmith — Mobile Companion

The same React/Next app, with a **field-first companion** layered on top — built on
the stack we've committed to (Next 16 + React 19 + Tailwind v4 + Capacitor + the PWA
shell). No React Native, no second codebase: one app, installed.

## What the companion is

A thumb-friendly cockpit for the contractor in the truck or at the door.

- **`/today`** — the companion home. Greeting, a hero **"Quote a job from a photo"**
  button, **today's scheduled jobs** (driven by the new job start dates), a
  **"Needs a nudge"** list (stale proposals), and the day's numbers.
- **`/today/quote`** — the field fast-path: two fields (homeowner + address), then
  straight into the camera. Creates the job and drops you into the photo-scope flow.
- **Photo → scope → quote** (`/jobs/[id]/scope`) — the hero. Snap the room, the AI
  (or grounded template) infers the work remaining, you confirm/edit every line, and
  send Good/Better/Best — all on a phone. This is the reason the companion exists.
- **On-site close** — the job page already does e-sign (drawn signature now persists),
  QR hand-off, deposit + progress/final invoicing, and call/text/email the homeowner.

## How it's wired

- **Bottom tab bar** (`BottomNav`, mobile only): Today · Jobs · **＋ (photo quote)** ·
  Pipeline · Settings. The raised center button is the photo-quote path.
- **PWA**: `manifest.webmanifest` now starts at `/today` and ships app shortcuts for
  "Quote from a photo" / Today / Pipeline. Installable from the browser today.
- **Capacitor** (`capacitor.config.ts`): the native iOS/Android shell wraps the LIVE
  web app via `server.url`, so a web redeploy updates the installed app instantly.
- **Camera**: photo capture uses the web file input with `capture="environment"`,
  which works inside the Capacitor webview and mobile browsers — no native plugin
  required. (Photos are downscaled client-side to keep uploads + AI tokens cheap.)

## Build the native binaries (owner step)

The PWA is the same-day install path. For store binaries:

```bash
npm run build            # web is served live; webDir=public for the shell
npx cap add android      # Android Studio + JDK (works on Windows)
npx cap add ios          # iOS needs a Mac + Xcode
npx cap sync
npx cap open android     # or: npx cap open ios
```

Store submission needs paid Apple/Google developer accounts. Until then, "Add to Home
Screen" gives the full standalone experience from `/today`. See `NATIVE_APP.md` for the
original Capacitor scaffold notes.
