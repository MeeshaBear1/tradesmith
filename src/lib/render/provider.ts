/**
 * Render provider abstraction. Default: Google Gemini 2.5 Flash Image ("Nano Banana"),
 * called over the REST API (no SDK dependency). The thin interface lets us later swap
 * to FLUX.1 Kontext (fal.ai) or OpenAI gpt-image-1.5 without touching callers.
 *
 * Anthropic's model is vision-INPUT only — it cannot generate images — so the render
 * path is deliberately a non-Anthropic provider.
 */

import { env, hasKey } from "@/config/env";

export interface RenderRequest {
  imageBase64: string;
  mediaType: string; // e.g. "image/png"
  prompt: string;
}

export interface RenderResult {
  pngBase64: string;
  mediaType: string;
}

export interface RenderProvider {
  readonly name: string;
  editHouse(req: RenderRequest): Promise<RenderResult | null>;
}

const GEMINI_MODEL = "gemini-2.5-flash-image"; // "Nano Banana"

type GeminiInline = { data?: string; mimeType?: string; mime_type?: string };
interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; inlineData?: GeminiInline; inline_data?: GeminiInline }[] } }[];
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

class GeminiRenderProvider implements RenderProvider {
  readonly name = GEMINI_MODEL;

  async editHouse(req: RenderRequest): Promise<RenderResult | null> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
      `?key=${env.geminiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: req.mediaType, data: req.imageBase64 } },
                { text: req.prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (!res.ok) {
        console.error("Gemini render HTTP", res.status, await safeText(res));
        return null;
      }
      const data = (await res.json()) as GeminiResponse;
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        const inline = p.inlineData ?? p.inline_data;
        if (inline?.data) {
          return { pngBase64: inline.data, mediaType: inline.mimeType ?? inline.mime_type ?? "image/png" };
        }
      }
      return null;
    } catch (err) {
      console.error("Gemini render error:", err);
      return null;
    }
  }
}

/** Returns the active provider, or null when no render key is configured. */
export function getRenderProvider(): RenderProvider | null {
  if (!hasKey("render")) return null;
  return new GeminiRenderProvider();
}
