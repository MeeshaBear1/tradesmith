"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Floating "Install app" pill that appears when the browser offers a PWA install. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Already installed / running standalone → never show.
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("ts_install_dismissed")) setHidden(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || hidden) return null;

  return (
    <div
      className="fixed right-4 z-50 flex items-center gap-2"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <button
        className="btn btn-primary shadow-lg"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice.catch(() => {});
          setDeferred(null);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
        </svg>
        Install app
      </button>
      <button
        aria-label="Dismiss"
        className="btn btn-ghost shadow-lg"
        onClick={() => {
          sessionStorage.setItem("ts_install_dismissed", "1");
          setHidden(true);
        }}
      >
        ✕
      </button>
    </div>
  );
}
