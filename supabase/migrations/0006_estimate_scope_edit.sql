-- Photo-to-scope quoting + line-item estimate editing.
--
-- `regional_factor` lets a line-item edit re-derive an estimate's total exactly
-- (the factor lifts the base before the compounding markup stack). `scope_meta`
-- stores the human-facing context of a photo-inferred scope (room, current state,
-- what's left, honest assumptions) for the review UI and proposal copy.

alter table public.estimates
  add column if not exists regional_factor numeric not null default 1,
  add column if not exists scope_meta jsonb;

comment on column public.estimates.regional_factor is
  'Regional pricing factor applied to base before markups; enables exact re-derivation on edit.';
comment on column public.estimates.scope_meta is
  'Photo-scope context: { roomType, currentState, floorSqft, summaries, assumptions, confidence, source }.';
