-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 8: señas y saldo a favor
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr.
--
--  Libro de movimientos de la plata que un cliente dejó por adelantado:
--    monto > 0  → seña / pago adelantado (tipo 'sena')
--    monto < 0  → se usó en un cobro (tipo 'uso', con visita_id) o se devolvió ('devolucion')
--  El saldo a favor de un perro es la suma de sus movimientos.
--  Si se borra la visita en la que se usó, el saldo vuelve solo (on delete cascade).
--  Mientras no se corra, la app funciona igual pero sin señas.
-- ════════════════════════════════════════════════════════════════════

begin;

-- turno_id es sólo informativo (sin clave foránea: turnos.id puede ser texto). visita_id toma el
-- tipo real de visitas.id para poder devolver el saldo si se borra la visita (on delete cascade).
do $$
declare tipo_visita text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_visita
  from pg_attribute a
  where a.attrelid = 'public.visitas'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.saldo_movimientos (
      id          bigint generated always as identity primary key,
      created_at  timestamptz not null default now(),
      cliente_id  bigint not null references public.clientes(id) on delete cascade,
      monto       integer not null check (monto <> 0),
      tipo        text not null default 'sena' check (tipo in ('sena', 'uso', 'devolucion')),
      forma_pago  text not null default 'efectivo',
      turno_id    text,
      visita_id   %s references public.visitas(id) on delete cascade,
      nota        text not null default '',
      fecha       date not null default current_date
    )$f$, tipo_visita);
end $$;

create index if not exists saldo_movimientos_cliente_idx on public.saldo_movimientos (cliente_id);

alter table public.saldo_movimientos enable row level security;
revoke all on public.saldo_movimientos from anon;
drop policy if exists "equipo_paupet" on public.saldo_movimientos;
create policy "equipo_paupet" on public.saldo_movimientos
  for all to authenticated using (true) with check (true);

commit;

-- Para ver quién tiene saldo a favor:
-- select c.dog, c.owner, sum(m.monto) as saldo
-- from public.saldo_movimientos m join public.clientes c on c.id = m.cliente_id
-- group by c.id having sum(m.monto) <> 0;
