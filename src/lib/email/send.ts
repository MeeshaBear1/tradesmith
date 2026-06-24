import { env, hasKey } from "@/config/env";
import { reportError } from "@/lib/observability";
import { formatCents } from "@/lib/money";

/**
 * Transactional email via Resend (REST, no SDK dep). Every send is FAIL-OPEN: with
 * no RESEND_API_KEY it is skipped, and any error is reported but never thrown — a
 * mail outage must never block signup, a proposal, or a payment.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!EMAIL_RE.test(msg.to)) return { ok: false, error: "bad_recipient" };
  if (!hasKey("email")) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text ?? stripHtml(msg.html),
      }),
    });
    if (!res.ok) {
      reportError(new Error(`resend_${res.status}`), { where: "sendEmail", to: msg.to });
      return { ok: false, error: `resend_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    reportError(err, { where: "sendEmail", to: msg.to });
    return { ok: false, error: "send_failed" };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function shell(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1d22">
  <h2 style="color:#1a1d22">${title}</h2>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e2e6ea;margin:20px 0" />
  <p style="font-size:12px;color:#677079">Sent by Tradesmith on behalf of your contractor.</p>
</div>`;
}

// ---- The three transactional sends ----

export function sendSignupWelcome(to: string, companyName: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "Welcome to Tradesmith",
    html: shell(
      `Welcome, ${escapeHtml(companyName)}`,
      `<p>Your shop is set up. Add your logo and rate card in Settings, then quote your first job from the driveway.</p>
       <p><a href="${env.appUrl}/dashboard" style="color:#ea4e1c">Open your dashboard →</a></p>`,
    ),
  });
}

export function sendProposalToHomeowner(
  to: string,
  args: { companyName: string; homeownerName: string; token: string },
): Promise<EmailResult> {
  const url = `${env.appUrl}/p/${args.token}`;
  return sendEmail({
    to,
    subject: `Your estimate from ${args.companyName}`,
    html: shell(
      `Hi ${escapeHtml(args.homeownerName)},`,
      `<p>${escapeHtml(args.companyName)} has prepared your estimate. Review the options, pick a package, and sign — all online.</p>
       <p><a href="${url}" style="background:#ea4e1c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">View your estimate →</a></p>
       <p style="font-size:12px;color:#677079">${url}</p>`,
    ),
  });
}

export function sendPaymentReceipt(
  to: string,
  args: { companyName: string; amountCents: number; address: string },
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Payment received — ${args.companyName}`,
    html: shell(
      "Thanks — your payment went through",
      `<p>We received your payment of <strong>${formatCents(args.amountCents)}</strong> for the work at ${escapeHtml(args.address)}.</p>
       <p>${escapeHtml(args.companyName)} will be in touch with next steps.</p>`,
    ),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
