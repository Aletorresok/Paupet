-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 4: horarios libres también desde Configuración
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr sin problema.
--
--  Antes, la página "Pedí tu turno" (/turnos) sólo mostraba los horarios guardados en
--  "Horarios para Stories": si Pau no armaba la semana, no aparecía ninguno.
--  Ahora, para cada día:
--    - si tiene horarios en "Horarios para Stories", se usan ésos (como antes);
--    - si no, se usan los horarios base de Configuración para ese día de la semana
--      (si el día está abierto), hasta los "días de anticipación" configurados (máx. 21).
--  Siempre se descartan: días apagados en Stories, horarios marcados como tomados,
--  los de menos de una hora desde ahora y los que se pisan con un turno de la agenda
--  (ahora se tiene en cuenta la duración del horario y la del turno).
--  Sigue devolviendo sólo fecha y hora: nunca datos de clientes.
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function public.horarios_libres()
returns table (fecha date, hora text)
language sql
stable
security definer
set search_path = public
as $funcion$
  with
  ahora as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as t
  ),
  cfg as (
    select coalesce(horarios_semanales::jsonb, '{}'::jsonb) as h,
           coalesce(slots::jsonb, '{}'::jsonb)              as base,
           coalesce(horarios::jsonb, '{}'::jsonb)           as abiertos,
           least(greatest(coalesce(anticip, 21), 1), 21)    as dias
    from config where id = 1
  ),
  -- Horarios cargados en "Horarios para Stories" (por fecha).
  stories as (
    select case when d.clave ~ '^\d{4}-\d{2}-\d{2}$' then d.clave::date end as fecha,
           s.hora,
           60 as minutos
    from cfg,
         jsonb_each(case when jsonb_typeof(cfg.h->'slots') = 'object'
                         then cfg.h->'slots' else '{}'::jsonb end) as d(clave, horas),
         jsonb_array_elements_text(case when jsonb_typeof(d.horas) = 'array'
                                        then d.horas else '[]'::jsonb end) as s(hora)
  ),
  dias_con_stories as (
    select distinct fecha from stories where fecha is not null
  ),
  -- Próximos días con el nombre del día como lo guarda Configuración (sin tildes).
  calendario as (
    select (a.t::date + g)::date as fecha,
           (array['domingo','lunes','martes','miercoles','jueves','viernes','sabado'])
             [extract(dow from a.t::date + g)::int + 1] as clave
    from ahora a, cfg, generate_series(0, cfg.dias) as g
  ),
  -- Horarios base de Configuración, sólo para los días que no tienen horarios en Stories.
  base as (
    select c.fecha,
           case when jsonb_typeof(e.v) = 'object' then e.v->>'hora' else e.v #>> '{}' end as hora,
           coalesce(case when jsonb_typeof(e.v) = 'object' and (e.v->>'duracion') ~ '^\d+$'
                         then (e.v->>'duracion')::int end, 60) as minutos
    from calendario c, cfg,
         jsonb_array_elements(case when jsonb_typeof(cfg.base->c.clave) = 'array'
                                   then cfg.base->c.clave else '[]'::jsonb end) as e(v)
    where coalesce(cfg.abiertos->c.clave->>'open', 'true') <> 'false'
      and c.fecha not in (select fecha from dias_con_stories)
  ),
  ofrecidos as (
    select x.fecha, x.hora, greatest(x.minutos, 1) as minutos,
           case when x.hora ~ '^([01]\d|2[0-3]):[0-5]\d$' then x.hora::time end as hora_t
    from (select fecha, hora, minutos from stories
          union all
          select fecha, hora, minutos from base) as x
  ),
  ocupados as (
    select left(t.fecha::text, 10) as fecha,
           case when t.hora ~ '^([01]{0,1}\d|2[0-3]):[0-5]\d' then substring(t.hora from '^\d{1,2}:\d{2}')::time end as desde,
           greatest(coalesce(t.duracion, 60), 1) as minutos
    from turnos t
  )
  select distinct o.fecha, o.hora
  from ofrecidos o, ahora, cfg
  where o.fecha is not null and o.hora_t is not null
    and o.fecha between ahora.t::date and ahora.t::date + 21
    -- con al menos una hora de anticipación
    and o.fecha + o.hora_t > ahora.t + interval '1 hour'
    -- día apagado en "Horarios para Stories"
    and not (coalesce(cfg.h->'diasActivos', '[]'::jsonb) @> jsonb_build_array('NO:' || o.fecha::text))
    -- horario marcado como tomado
    and not (coalesce(cfg.h->'tomados'->(o.fecha::text), '[]'::jsonb) @> jsonb_build_array(o.hora))
    -- se pisa con un turno de la agenda
    and not exists (
      select 1 from ocupados x
      where x.fecha = o.fecha::text and x.desde is not null
        and o.hora_t < x.desde + make_interval(mins => x.minutos)
        and x.desde < o.hora_t + make_interval(mins => o.minutos)
    )
  order by o.fecha, o.hora;
$funcion$;

revoke all on function public.horarios_libres() from public;
grant execute on function public.horarios_libres() to anon, authenticated;

commit;

-- Para probar: debería listar los horarios libres de las próximas semanas.
-- select * from public.horarios_libres();
