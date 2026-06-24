-- Tier 1: persist the drawn signature image, and support progress/final invoicing.
--
-- The signature pad already draws a PNG; it was being discarded (only the typed
-- name persisted) — a legal/trust hole on an e-signature. Persist it. Progress and
-- final invoices reuse the existing invoices table (type already allows them); no
-- new columns are needed for billing beyond what's here.

alter table public.proposals
  add column if not exists signature_data_url text;

comment on column public.proposals.signature_data_url is
  'Data URL (PNG) of the homeowner''s drawn signature, captured at acceptance.';
