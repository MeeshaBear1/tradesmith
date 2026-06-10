-- Demo tenant powering the public "try the demo" login (/api/dev/login-as-demo).
-- Fixed UUID matches DEMO_CONTRACTOR_ID in src/lib/db/demo.ts. Password is null so the
-- bypass login works without credentials. Jobs are added by scripts/seed-demo.mjs.
insert into contractors (id, name, brand_color, phone, email, license_no, created_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'Apex Roofing & Exteriors',
  '#c2410c',
  '(503) 555-0142',
  'estimates@apexroofing.example',
  'CCB #224180',
  '2026-01-02T00:00:00Z'
)
on conflict (id) do nothing;
