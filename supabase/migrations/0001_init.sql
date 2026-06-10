-- Tradesmith schema. All money in integer cents. JSONB for measurement/tiers/scope.
-- App access is via the service-role key with explicit contractor_id filters;
-- RLS below is defense-in-depth for any future anon/auth client access.

create extension if not exists "pgcrypto";

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  brand_color text not null default '#c2410c',
  phone text,
  email text,
  license_no text,
  default_rate_card jsonb,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  vertical text not null default 'roofing',
  homeowner_name text not null,
  homeowner_email text,
  address text not null,
  lat double precision,
  lng double precision,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists jobs_contractor_idx on jobs(contractor_id);

create table if not exists takeoffs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  vertical text not null default 'roofing',
  source text not null,
  satellite_image_url text,
  measurement jsonb not null,
  confidence numeric,
  created_at timestamptz not null default now()
);
create index if not exists takeoffs_job_idx on takeoffs(job_id);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  vertical text not null default 'roofing',
  takeoff_id uuid references takeoffs(id) on delete set null,
  inputs jsonb,
  version int not null default 1,
  tiers jsonb not null,
  selected_tier text not null default 'better',
  total_cents int not null,
  created_at timestamptz not null default now(),
  unique (job_id, version)
);
create index if not exists estimates_job_idx on estimates(job_id);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  estimate_id uuid not null references estimates(id) on delete cascade,
  public_token text not null unique,
  status text not null default 'sent',
  scope_copy jsonb,
  signature_name text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  proposal_id uuid not null references proposals(id) on delete cascade,
  public_token text not null unique,
  amount_cents int not null,
  deposit_cents int not null default 0,
  type text not null default 'deposit',
  status text not null default 'open',
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (proposal_id, type)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  amount_cents int not null,
  stripe_event_id text not null unique,
  stripe_payment_intent_id text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists financing_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  amount_cents int not null,
  term_months int not null,
  apr numeric not null,
  monthly_payment_cents int not null,
  decision text not null,
  provider text not null default 'mock_lender',
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'feedback',
  name text not null,
  email text not null,
  company text,
  role text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists change_orders (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  description text,
  line_items jsonb,
  delta_cents int not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Defense-in-depth: enable RLS on every table and deny anon/authenticated by
-- default. All app access is via the service-role key (which bypasses RLS),
-- with explicit contractor_id filters in app code. This makes a missing app-layer
-- filter fail closed rather than exposing data, and prevents accidental anon-key reads.
do $$
declare t text;
begin
  foreach t in array array[
    'contractors','jobs','takeoffs','estimates','proposals',
    'invoices','payments','financing_applications','change_orders','feedback'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists deny_all on %I', t);
    execute format('create policy deny_all on %I for all to anon, authenticated using (false) with check (false)', t);
  end loop;
end $$;
