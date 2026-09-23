-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 3: horarios libres para la página "Pedí tu turno"
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr sin problema.
--
--  La página pública (/turnos) NO lee ninguna tabla: sólo llama a esta función,
--  que devuelve fecha y hora de los horarios libres. Nunca nombres, teléfonos
--  ni ningún otro dato de clientes o turnos.
--
--  Libre = está en "Horarios para Stories" (guardado), el día no está apagado,
--  no está marcado como tomado y no se pisa con un turno de la agenda.
--  Compatible con la versión anterior: no cambia tablas ni datos.
-- ════════════════════════════════════════════════════════════════════

begin;

-- La duración de los turnos (igual que en la migración 2; si ya existe, no hace nada).
alter table public.turnos add column if not exists duracion integer not null default 60;

create or replace function public.horarios_libres()
returns table (fecha date, hora text)
language sql
stable
security definer
set search_path = public
as $$
  with
  ahora as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as t
  ),
  semana as (
    select coalesce(horarios_semanales::jsonb, '{}'::jsonb) as h
    from config where id = 1
  ),
  ofrecidos as (
    -- los CASE evitan convertir textos raros (Postgres no garantiza el orden del WHERE)
    select case when d.clave ~ '^\d{4}-\d{2}-\d{2}$' then d.clave::date end as fecha,
           s.hora,
           case when s.hora ~ '^([01]\d|2[0-3]):[0-5]\d$' then s.hora::time end as hora_t
    from semana,
         jsonb_each(case when jsonb_typeof(semana.h->'slots') = 'object'
                         then semana.h->'slots' else '{}'::jsonb end) as d(clave, horas),
         jsonb_array_elements_text(case when jsonb_typeof(d.horas) = 'array'
                                        then d.horas else '[]'::jsonb end) as s(hora)
  ),
  ocupados as (
    select left(t.fecha::text, 10) as fecha,
           case when t.hora ~ '^([01]?\d|2[0-3]):[0-5]\d' then substring(t.hora from '^\d{1,2}:\d{2}')::time end as desde,
           greatest(coalesce(t.duracion, 60), 1) as minutos
    from turnos t
  )
  select distinct o.fecha, o.hora
  from ofrecidos o, ahora, semana
  where o.fecha is not null and o.hora_t is not null
    and o.fecha between ahora.t::date and ahora.t::date + 21
    -- con al menos una hora de anticipación
    and o.fecha + o.hora_t > ahora.t + interval '1 hour'
    -- día apagado en "Horarios para Stories"
    and not (coalesce(semana.h->'diasActivos', '[]'::jsonb) ? ('NO:' || o.fecha::text))
    -- horario marcado como tomado
    and not (coalesce(semana.h->'tomados'->(o.fecha::text), '[]'::jsonb) ? o.hora)
    -- ya hay un turno en ese momento
    and not exists (
      select 1 from ocupados x
      where x.fecha = o.fecha::text
        and o.hora_t >= x.desde
        and o.hora_t <  x.desde + make_interval(mins => x.minutos)
    )
  order by o.fecha, o.hora;
$$;

revoke all on function public.horarios_libres() from public;
grant execute on function public.horarios_libres() to anon, authenticated;

commit;

-- Para probar: debería listar los horarios libres de las próximas 3 semanas.
-- select * from public.horarios_libres();
