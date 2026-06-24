-- Tier 1: lightweight scheduling. Jobs gain optional start/end dates so a shop can
-- plan crews and the mobile companion can show "today's jobs". No calendar engine —
-- just the fields and a simple editor.

alter table public.jobs
  add column if not exists start_date date,
  add column if not exists end_date date;

comment on column public.jobs.start_date is 'Optional scheduled start date (crew planning).';
comment on column public.jobs.end_date is 'Optional scheduled end date.';
