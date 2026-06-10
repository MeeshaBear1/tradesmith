"use client";

import { useRef, useState } from "react";

/** Snap a job photo with the phone camera (or pick a file). Emits the File + a data URL. */
export function CameraCapture({
  onCapture,
  label = "Snap a photo of the roof",
  hint = "Use your phone camera, or pick a file",
}: {
  onCapture: (file: File, dataUrl: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setPreview(url);
      onCapture(file, url);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFile}
      />
      {preview ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Captured roof"
            className="aspect-video w-full rounded-lg border border-[var(--line)] object-cover"
          />
          <button type="button" className="btn btn-ghost text-sm" onClick={pick}>
            Retake
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-8 text-center transition hover:border-[var(--brand)]"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="font-semibold">{label}</span>
          <span className="text-xs text-[var(--muted)]">{hint}</span>
        </button>
      )}
    </div>
  );
}
