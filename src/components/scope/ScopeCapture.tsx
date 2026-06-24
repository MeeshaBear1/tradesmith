"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ROOMS = [
  { value: "bathroom", label: "Bathroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bedroom", label: "Bedroom" },
  { value: "living", label: "Living room" },
  { value: "laundry", label: "Laundry" },
  { value: "basement", label: "Basement" },
  { value: "room", label: "Other room" },
];
const STATES = [
  { value: "framed", label: "Framed (studs, no drywall)" },
  { value: "rough_in", label: "Rough-in done" },
  { value: "drywalled", label: "Drywalled, unfinished" },
  { value: "gutted", label: "Gutted to studs" },
  { value: "cosmetic", label: "Dated — cosmetic refresh" },
];

/** Downscale a captured photo so uploads stay small and AI tokens cheap. */
function fileToDataUrl(file: File, maxDim = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no_canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad_image"));
    };
    img.src = url;
  });
}

export function ScopeCapture({ jobId }: { jobId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [roomType, setRoomType] = useState("bathroom");
  const [currentState, setCurrentState] = useState("framed");
  const [floorSqft, setFloorSqft] = useState("48");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6);
    try {
      const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
      setPhotos((p) => [...p, ...urls].slice(0, 6));
    } catch {
      setError("Could not read one of those photos.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          photos,
          roomType,
          currentState,
          floorSqft: Number(floorSqft) || 48,
          notes: notes.trim() || undefined,
        }),
      });
      if (res.status === 429) {
        setError("You've run a lot of scopes just now — give it a minute.");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        setError("Could not build a quote. Try again.");
        setBusy(false);
        return;
      }
      router.push(`/jobs/${jobId}`);
      router.refresh();
    } catch {
      setError("Could not build a quote. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="label mb-3">1 · Photograph the space</div>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Snap the room from a couple of angles — framing, plumbing stubs, whatever&apos;s there. Our AI reads
          the photos to figure out what&apos;s left to finish. No photos? You&apos;ll still get a grounded
          starting quote from the details below.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFiles}
          className="hidden"
          id="scope-photos"
        />
        <label htmlFor="scope-photos" className="btn btn-ghost cursor-pointer">
          📷 Add photos
        </label>
        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={i} className="relative">
                <img src={p} alt={`Photo ${i + 1}`} className="h-24 w-full rounded-lg object-cover" />
                <button
                  onClick={() => setPhotos((ps) => ps.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="label mb-3">2 · Confirm the basics</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Room">
            <select className="input" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              {ROOMS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current state">
            <select className="input" value={currentState} onChange={(e) => setCurrentState(e.target.value)}>
              {STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Floor area (sq ft)">
            <input
              className="input"
              inputMode="numeric"
              value={floorSqft}
              onChange={(e) => setFloorSqft(e.target.value)}
            />
          </Field>
          <Field label="Notes (optional)">
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. move the vanity wall"
            />
          </Field>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <button onClick={submit} disabled={busy} className="btn btn-primary w-full sm:w-auto">
        {busy ? "Reading the room…" : "Build the quote →"}
      </button>
      <p className="text-xs text-[var(--muted)]">
        You&apos;ll review and edit every line before anything goes to the homeowner.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
