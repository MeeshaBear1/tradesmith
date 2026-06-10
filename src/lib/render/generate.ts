/**
 * Async render orchestrator. NEVER called in the quoting loop — it runs after the
 * proposal is created (Next `after()`), so the contractor advances immediately and a
 * preview resolves in the background. Fully gated and crash-safe: with no render keys
 * it's a silent no-op and the Tier-1 swatch board carries the page.
 */

import { hasKey } from "@/config/env";
import type { Store } from "@/lib/db/store";
import type { RenderStatus } from "@/lib/db/types";
import type { Tier, Vertical } from "@/lib/takeoff/types";
import { fetchImageBase64 } from "@/lib/roofing/vision";
import { createAdminClient } from "@/lib/supabase/admin";
import { materialBoard } from "@/lib/render/catalog";
import { buildHouseEditPrompt, renderableVertical } from "@/lib/render/prompts";
import { getRenderProvider } from "@/lib/render/provider";

const BUCKET = "renderings";

export interface RenderOutcome {
  status: RenderStatus;
  url: string | null;
  reason?: string;
}

export async function generateRenderForJob(
  store: Store,
  args: { jobId: string; vertical: Vertical; tier: Tier; colorName?: string },
): Promise<RenderOutcome> {
  if (!hasKey("render")) return { status: "none", url: null, reason: "render_disabled" };
  if (!renderableVertical(args.vertical)) return { status: "none", url: null, reason: "vertical_not_renderable" };

  const board = materialBoard(args.vertical, args.tier);
  if (!board || board.swatches.length === 0) return { status: "none", url: null, reason: "no_material_board" };
  const swatch = board.swatches.find((s) => s.name === args.colorName) ?? board.swatches[0];
  const cacheKey = `${args.vertical}:${args.tier}:${swatch.name}`;

  const takeoff = await store.getLatestTakeoff(args.jobId);
  if (!takeoff) return { status: "none", url: null, reason: "no_takeoff" };

  // Cache hit — same finish already rendered; never re-bill.
  if (takeoff.renderKey === cacheKey && takeoff.renderImageUrl && takeoff.renderStatus === "ready") {
    return { status: "ready", url: takeoff.renderImageUrl };
  }

  // Source image: roofing uses the satellite tile. Front-of-house photo upload for
  // siding/paint/windows is a separate, queued pipeline.
  const sourceUrl = takeoff.satelliteImageUrl;
  if (!sourceUrl) return { status: "none", url: null, reason: "no_source_image" };

  const provider = getRenderProvider();
  if (!provider) return { status: "none", url: null, reason: "no_provider" };

  const prompt = buildHouseEditPrompt(args.vertical, board.material, swatch.name);

  try {
    await store.setTakeoffRender(takeoff.id, {
      renderStatus: "pending",
      renderKey: cacheKey,
      renderPrompt: prompt,
    });

    const src = await fetchImageBase64(sourceUrl);
    if (!src) {
      await store.setTakeoffRender(takeoff.id, { renderStatus: "failed" });
      return { status: "failed", url: null, reason: "source_fetch_failed" };
    }

    const out = await provider.editHouse({ imageBase64: src.data, mediaType: src.mediaType, prompt });
    if (!out) {
      await store.setTakeoffRender(takeoff.id, { renderStatus: "failed" });
      return { status: "failed", url: null, reason: "provider_failed" };
    }

    const bytes = Buffer.from(out.pngBase64, "base64");
    const path = `${args.jobId}/${cacheKey.replace(/[^a-z0-9_-]/gi, "_")}.png`;
    const storage = createAdminClient().storage.from(BUCKET);
    const up = await storage.upload(path, bytes, {
      contentType: out.mediaType || "image/png",
      upsert: true,
    });
    if (up.error) {
      await store.setTakeoffRender(takeoff.id, { renderStatus: "failed" });
      return { status: "failed", url: null, reason: "upload_failed" };
    }

    const { data: pub } = storage.getPublicUrl(path);
    await store.setTakeoffRender(takeoff.id, { renderStatus: "ready", renderImageUrl: pub.publicUrl });
    return { status: "ready", url: pub.publicUrl };
  } catch (err) {
    console.error("generateRenderForJob error:", err);
    try {
      await store.setTakeoffRender(takeoff.id, { renderStatus: "failed" });
    } catch {
      /* swallow — render is best-effort */
    }
    return { status: "failed", url: null, reason: "exception" };
  }
}
