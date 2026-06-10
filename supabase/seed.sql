-- Demo tenant. The fixed UUID matches DEMO_CONTRACTOR_ID in src/lib/db/demo.ts
-- so the /api/dev/login-as-demo bypass resolves to a real row.

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

insert into jobs (contractor_id, vertical, homeowner_name, homeowner_email, address, status)
values
  ('11111111-1111-1111-1111-111111111111', 'roofing', 'Dana & Mark Whitfield', 'dana.whitfield@example.com', '4821 SE Lincoln St, Portland, OR 97215', 'estimated'),
  ('11111111-1111-1111-1111-111111111111', 'gutters', 'Priya Raghunathan', 'praghu@example.com', '1190 NW Overton St, Portland, OR 97209', 'paid'),
  ('11111111-1111-1111-1111-111111111111', 'siding', 'The Castellano Residence', null, '8800 N Lombard St, Portland, OR 97203', 'new')
on conflict do nothing;
