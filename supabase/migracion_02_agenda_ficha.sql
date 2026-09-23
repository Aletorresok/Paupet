-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 2: agenda con duración y ficha de cliente
--  Correr UNA vez en Supabase → SQL Editor.
--  Es compatible con la versión anterior: sólo AGREGA cosas que ella ignora.
--  La versión nueva funciona aunque todavía no se haya corrido (usa 60 min
--  por defecto y oculta etiquetas y fotos hasta que existan).
-- ════════════════════════════════════════════════════════════════════

begin;

-- 1) Duración de cada turno, en minutos (los turnos existentes quedan en 60).
alter table public.turnos add column if not exists duracion integer not null default 60;

-- 2) Etiquetas de cada perro ("Miedo al secador", "Alergia: avena", ...).
alter table public.clientes add column if not exists etiquetas jsonb not null default '[]'::jsonb;

-- 3) Fotos de antes y después de cada perro.
create table if not exists public.fotos_cliente (
  id          bigint generated always as identity primary key,
  cliente_id  bigint not null references public.clientes(id) on delete cascade,
  url         text   not null,
  tipo        text   not null check (tipo in ('antes', 'despues')),
  fecha       date   not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists fotos_cliente_cliente_idx on public.fotos_cliente (cliente_id);

-- Sólo usuarios logueados (igual que el resto de las tablas).
alter table public.fotos_cliente enable row level security;
revoke all on public.fotos_cliente from anon;
drop policy if exists "equipo_paupet" on public.fotos_cliente;
create policy "equipo_paupet" on public.fotos_cliente
  for all to authenticated using (true) with check (true);

commit;

-- Verificación
select column_name, table_name from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'turnos' and column_name = 'duracion')
    or (table_name = 'clientes' and column_name = 'etiquetas'));
select tablename, policyname from pg_policies where tablename = 'fotos_cliente';
