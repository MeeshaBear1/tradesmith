import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell (iOS/Android) wraps the LIVE deployed web app via `server.url`,
 * not a static export — so a web redeploy updates the app instantly. See NATIVE_APP.md.
 */
const config: CapacitorConfig = {
  appId: "build.tradesmith.app",
  appName: "Tradesmith",
  webDir: "public",
  server: {
    url: "https://tradesmith-nu.vercel.app",
    cleartext: false,
  },
  backgroundColor: "#15181c",
};

export default config;
