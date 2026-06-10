-- Pilot-grade per-contractor auth: scrypt password hash (salt:hash). Null for the
-- demo tenant (login bypass). Real OAuth/SSO can layer on later.
alter table contractors add column if not exists password_hash text;

-- Speed up email lookups for sign-in.
create index if not exists contractors_email_idx on contractors (lower(email));
