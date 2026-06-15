import Anthropic from "@anthropic-ai/sdk";
import { env, hasKey } from "@/config/env";
import type { ScopeCopy } from "@/lib/db/types";
import type { EstimateTier, Inputs, RoofingDetail, Vertical } from "@/lib/takeoff/types";
import { formatCents } from "@/lib/money";
import { getVertical } from "@/lib/verticals/registry";

export interface ScopeInputs {
  contractorName: string;
  homeownerName: string;
  address: string;
  detail: RoofingDetail;
  tier: EstimateTier;
}

function templatedScope(i: ScopeInputs): ScopeCopy {
  const squares = i.tier.squares;
  return {
    headline: `${i.tier.label} Roof Replacement Proposal`,
    intro: `Prepared by ${i.contractorName} for ${i.homeownerName} at ${i.address}. This proposal covers a complete tear-off and replacement of approximately ${squares} squares (${Math.round(squares * 100)} sq ft) of roofing, installed to manufacturer and code specifications.`,
    sections: [
      {
        title: "Scope of Work",
        body: `Remove existing roofing down to the deck, inspect and prepare the substrate, and install a new ${i.tier.label.toLowerCase()}-grade roofing system including underlayment, ice & water shield, drip edge, starter strip, and ridge cap. All penetrations re-flashed and sealed.`,
      },
      {
        title: "Materials & Workmanship",
        body: `Premium materials with manufacturer warranty, installed by ${i.contractorName}'s licensed crews. Job site protected and cleaned daily; full magnetic nail sweep on completion.`,
      },
      {
        title: "Investment",
        body: `Total investment for the ${i.tier.label} package: ${formatCents(i.tier.totalCents)}. Flexible monthly financing is available — ask about same-as-cash terms.`,
      },
    ],
  };
}

const TOOL: Anthropic.Tool = {
  name: "write_scope",
  description: "Write warm, professional, plain-English proposal copy for a residential roof replacement.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "Short proposal headline, < 8 words." },
      intro: { type: "string", description: "2-3 sentence intro addressed to the homeowner." },
      sections: {
        type: "array",
        description: "3-4 sections covering scope, materials/workmanship, warranty, and investment.",
        items: {
          type: "object",
          properties: { title: { type: "string" }, body: { type: "string" } },
          required: ["title", "body"],
        },
      },
    },
    required: ["headline", "intro", "sections"],
  },
};

/** Templated scope copy for any non-roofing (form-based) trade. */
export function genericScopeCopy(opts: {
  contractorName: string;
  homeownerName: string;
  address: string;
  vertical: Vertical;
  tier: EstimateTier;
  inputs: Inputs;
}): ScopeCopy {
  const config = getVertical(opts.vertical);
  const scope = config.scopeBlurb(opts.inputs, opts.tier);
  return {
    headline: `${opts.tier.label} ${config.label} Proposal`,
    intro: `Prepared by ${opts.contractorName} for ${opts.homeownerName} at ${opts.address}. ${scope}`,
    sections: [
      { title: "Scope of Work", body: scope },
      {
        title: "Materials & Workmanship",
        body: `${opts.tier.label}-grade materials installed by ${opts.contractorName}'s licensed crews. Job site protected and cleaned daily, with a full walkthrough on completion.`,
      },
      {
        title: "Investment",
        body: `Total investment for the ${opts.tier.label} package: ${formatCents(opts.tier.totalCents)}. Flexible monthly financing is available — ask about terms.`,
      },
    ],
  };
}

export async function generateScopeCopy(i: ScopeInputs): Promise<ScopeCopy> {
  if (!hasKey("anthropic")) return templatedScope(i);
  try {
    const client = new Anthropic({ apiKey: env.anthropicKey });
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "write_scope" },
      messages: [
        {
          role: "user",
          content: `Write proposal copy for a roof replacement.
Contractor: ${i.contractorName}
Homeowner: ${i.homeownerName}
Address: ${i.address}
Package: ${i.tier.label}
Size: ~${i.tier.squares} squares, ${i.detail.complexity} complexity, ${i.detail.pitchX12}/12 pitch
Total price: ${formatCents(i.tier.totalCents)}
Be warm and trustworthy, never pushy. Avoid jargon a homeowner wouldn't know. Mention financing is available.`,
        },
      ],
    });
    const tool = res.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!tool) return templatedScope(i);
    return tool.input as unknown as ScopeCopy;
  } catch (err) {
    console.error("generateScopeCopy failed:", err);
    return templatedScope(i);
  }
}
