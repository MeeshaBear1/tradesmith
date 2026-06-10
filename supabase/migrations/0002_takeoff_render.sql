-- AI img2img "after" render (Google Gemini 2.5 Flash Image, "Nano Banana").
-- Render state lives on the takeoff; the Tier-1 swatch board is the always-on fallback.

alter table takeoffs add column if not exists render_status text not null default 'none';
alter table takeoffs add column if not exists render_image_url text;
alter table takeoffs add column if not exists render_key text;   -- cache key: vertical:tier:color
alter table takeoffs add column if not exists render_prompt text;

-- Public bucket for generated renders. Public-read is acceptable: a render is a
-- non-sensitive marketing image of a finished home, surfaced on a token-gated proposal.
-- Guarded: on a freshly-provisioned project the `storage` schema can lag the Postgres
-- DB by a few seconds, so skip (don't fail the migration) if it isn't ready yet. The
-- render feature recreates the bucket on first use anyway.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('renderings', 'renderings', true)
    on conflict (id) do nothing;
  end if;
end $$;
