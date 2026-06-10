"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a scannable QR for a link — show it in person, the homeowner scans to open. */
export function QrCode({
  value,
  size = 220,
  className = "",
  caption,
}: {
  value: string;
  size?: number;
  className?: string;
  caption?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#15181c", light: "#ffffff" } })
      .then((d) => active && setUrl(d))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div className={`inline-block ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Scan to open" width={size} height={size} className="rounded-lg" />
      ) : (
        <div className="rounded-lg bg-[var(--surface-sunken)]" style={{ width: size, height: size }} />
      )}
      {caption && <div className="spec mt-2 text-center">{caption}</div>}
    </div>
  );
}
