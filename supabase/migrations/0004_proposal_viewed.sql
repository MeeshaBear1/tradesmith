-- Proposal open-tracking: stamp the first time a homeowner opens the proposal link,
-- so the contractor knows to follow up. Status flips 'sent' -> 'viewed' on first open.
alter table proposals add column if not exists viewed_at timestamptz;
