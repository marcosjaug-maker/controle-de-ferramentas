-- ============================================================
-- FerramentasTrack — Schema Supabase (com rastreio de usuário)
-- Cole este SQL no Supabase: SQL Editor → New Query → Run
-- ============================================================

create table if not exists tools (
  id         bigserial primary key,
  name       text not null,
  serial     text not null unique,
  category   text not null,
  created_at timestamptz default now()
);

create table if not exists sites (
  id         bigserial primary key,
  name       text not null,
  address    text not null,
  created_at timestamptz default now()
);

create table if not exists records (
  id            bigserial primary key,
  tool_id       bigint references tools(id) on delete cascade,
  site_id       bigint references sites(id) on delete cascade,
  responsible   text not null,
  delivery_date date not null,
  return_date   date not null,
  actual_return date,
  returned_by   text,
  notes         text default '',
  created_by    text not null default 'Sistema',
  created_at    timestamptz default now()
);

alter table tools   enable row level security;
alter table sites   enable row level security;
alter table records enable row level security;

create policy "public_all" on tools   for all using (true) with check (true);
create policy "public_all" on sites   for all using (true) with check (true);
create policy "public_all" on records for all using (true) with check (true);

alter publication supabase_realtime add table tools;
alter publication supabase_realtime add table sites;
alter publication supabase_realtime add table records;

insert into tools (name, serial, category) values
  ('Furadeira Bosch 750W', 'BSH-001', 'Elétrica'),
  ('Betoneira 400L',       'BET-002', 'Pesada'),
  ('Nível a Laser',        'NVL-003', 'Medição'),
  ('Esmerilhadeira 9"',    'ESM-004', 'Elétrica'),
  ('Compactador de Solo',  'CMP-005', 'Pesada'),
  ('Trena Digital 50m',    'TRN-006', 'Medição')
on conflict (serial) do nothing;

insert into sites (name, address) values
  ('Obra Vila Madalena', 'Rua Aspicuelta, 412 - Vila Madalena, SP'),
  ('Obra Lapa',          'Av. Antártica, 890 - Lapa, SP'),
  ('Reforma Pinheiros',  'Rua dos Pinheiros, 230 - Pinheiros, SP')
on conflict do nothing;
