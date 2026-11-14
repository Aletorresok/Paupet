-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 9: turnos desde Google Calendar
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr.
--
--  Los eventos del calendario de Pau que tengan 🐶 o la palabra "turno" en el título
--  entran a Paupet como turnos. Para no traerlos dos veces, cada turno guarda de qué
--  evento salió:
--    turnos.gcal_uid     → identificador del evento en Calendar (único)
--    turnos.gcal_titulo  → el título tal cual se escribió
--    turnos.gcal_inicio  → día, hora y duración del evento la última vez que se leyó
--                          (si cambia en Calendar, el turno se mueve)
--  calendar_sync (una sola fila): la dirección secreta del calendario y los eventos
--  que Pau borró de Paupet (para no volver a traerlos).
--  Mientras no se corra, la app funciona igual pero sin esta conexión.
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.turnos add column if not exists gcal_uid text;
alter table public.turnos add column if not exists gcal_titulo text;
alter table public.turnos add column if not exists gcal_inicio text;
create unique index if not exists turnos_gcal_uid_idx on public.turnos (gcal_uid) where gcal_uid is not null;

-- Un turno importado puede entrar sin perro (si el título no alcanza para reconocerlo).
alter table public.turnos alter column cliente_id drop not null;

create table if not exists public.calendar_sync (
  id         integer primary key default 1 check (id = 1),
  ical_url   text not null default '',
  ignorados  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.calendar_sync (id) values (1) on conflict (id) do nothing;

-- La dirección secreta deja leer todo el calendario: sólo la ven los usuarios de la app.
alter table public.calendar_sync enable row level security;
revoke all on public.calendar_sync from anon;
drop policy if exists "equipo_paupet" on public.calendar_sync;
create policy "equipo_paupet" on public.calendar_sync
  for all to authenticated using (true) with check (true);

commit;

-- Para desconectar el calendario a mano:
-- update public.calendar_sync set ical_url = '' where id = 1;
-- Para ver los turnos que vinieron de Calendar:
-- select fecha, hora, dog_name, servicio, gcal_titulo from public.turnos where gcal_uid is not null order by fecha, hora;
