-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 5: pedidos de turno desde /turnos
--  Correr UNA vez en Supabase → SQL Editor (después de la 4). Se puede volver a correr.
--
--  1) Tabla `pedidos_turno`: lo que la gente pide en /turnos queda guardado para que Pau lo
--     acepte, proponga otro horario o lo rechace desde la app. Nadie de afuera puede leerla.
--  2) Función `pedir_turno(...)`: la única forma de escribir un pedido desde la página pública.
--     Valida los datos y limita la cantidad (no más de 5 por teléfono por día, 40 por hora).
--  3) `horarios_libres()` vuelve a usar SÓLO lo cargado en "Horarios para Stories" (si Pau no
--     cargó la semana, /turnos pide escribir cuándo le queda bien). Mantiene el control de
--     duraciones de la migración 4 y además no ofrece horarios ya pedidos o propuestos.
--  Todo son PEDIDOS: nada queda reservado hasta que Pau lo confirma.
-- ════════════════════════════════════════════════════════════════════

begin;

-- 1) Pedidos ─────────────────────────────────────────────────────────
create table if not exists public.pedidos_turno (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- nuevo: sin responder · propuesto: Pau ofreció otro horario · aceptado: ya es un turno · rechazado
  estado      text not null default 'nuevo' check (estado in ('nuevo', 'propuesto', 'aceptado', 'rechazado')),
  perro       text not null,
  duenio      text not null,
  tel         text not null,             -- sólo dígitos
  raza        text not null default '',
  tamanio     text not null default '',
  vino_antes  text not null default '',
  servicios   text not null default '',
  notas       text not null default '',  -- "para tener en cuenta" + comentario
  fecha       date,                      -- horario pedido (null = escribió cuándo puede)
  hora        text,
  preferencia text not null default '',  -- lo que escribió si no eligió horario
  fecha_prop  date,                      -- horario que propuso Pau
  hora_prop   text,
  turno_id    bigint,                    -- turno creado al aceptar
  avisado     boolean not null default false  -- ya se le mandó la confirmación por WhatsApp
);
create index if not exists pedidos_turno_estado_idx on public.pedidos_turno (estado, created_at desc);

alter table public.pedidos_turno enable row level security;
revoke all on public.pedidos_turno from anon;
drop policy if exists "equipo_paupet" on public.pedidos_turno;
create policy "equipo_paupet" on public.pedidos_turno
  for all to authenticated using (true) with check (true);

-- 2) Pedir turno (página pública) ────────────────────────────────────
create or replace function public.pedir_turno(
  p_perro text, p_duenio text, p_tel text,
  p_raza text default '', p_tamanio text default '', p_vino_antes text default '',
  p_servicios text default '', p_notas text default '',
  p_fecha date default null, p_hora text default null, p_preferencia text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public
as $funcion$
declare
  v_tel text := regexp_replace(coalesce(p_tel, ''), '\D', '', 'g');
  v_id  bigint;
begin
  if length(trim(coalesce(p_perro, ''))) = 0 or length(trim(coalesce(p_duenio, ''))) = 0 then
    raise exception 'faltan_datos';
  end if;
  if length(v_tel) < 8 or length(v_tel) > 15 then
    raise exception 'telefono_invalido';
  end if;
  if length(p_perro) > 60 or length(p_duenio) > 80 or length(coalesce(p_raza, '')) > 60
     or length(coalesce(p_tamanio, '')) > 30 or length(coalesce(p_vino_antes, '')) > 40
     or length(coalesce(p_servicios, '')) > 200 or length(coalesce(p_notas, '')) > 600
     or length(coalesce(p_preferencia, '')) > 300 then
    raise exception 'texto_largo';
  end if;
  if p_hora is not null and p_hora !~ '^([01]\d|2[0-3]):[0-5]\d$' then
    raise exception 'hora_invalida';
  end if;
  if p_fecha is not null and (p_fecha < current_date - 1 or p_fecha > current_date + 60) then
    raise exception 'fecha_invalida';
  end if;

  -- El mismo pedido enviado dos veces seguidas (doble toque): se devuelve el que ya estaba.
  select id into v_id from pedidos_turno
  where tel = v_tel and lower(perro) = lower(trim(p_perro))
    and fecha is not distinct from p_fecha and hora is not distinct from p_hora
    and created_at > now() - interval '30 minutes'
  limit 1;
  if v_id is not null then return v_id; end if;

  if (select count(*) from pedidos_turno where tel = v_tel and created_at > now() - interval '1 day') >= 5
     or (select count(*) from pedidos_turno where created_at > now() - interval '1 hour') >= 40 then
    raise exception 'demasiados_pedidos';
  end if;

  insert into pedidos_turno (perro, duenio, tel, raza, tamanio, vino_antes, servicios, notas, fecha, hora, preferencia)
  values (trim(p_perro), trim(p_duenio), v_tel, trim(coalesce(p_raza, '')), coalesce(p_tamanio, ''),
          coalesce(p_vino_antes, ''), coalesce(p_servicios, ''), coalesce(p_notas, ''),
          p_fecha, p_hora, coalesce(p_preferencia, ''))
  returning id into v_id;
  return v_id;
end;
$funcion$;

revoke all on function public.pedir_turno(text, text, text, text, text, text, text, text, date, text, text) from public;
grant execute on function public.pedir_turno(text, text, text, text, text, text, text, text, date, text, text) to anon, authenticated;

-- 3) Horarios libres: sólo "Horarios para Stories" ───────────────────
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
  semana as (
    select coalesce(horarios_semanales::jsonb, '{}'::jsonb) as h
    from config where id = 1
  ),
  ofrecidos as (
    select case when d.clave ~ '^\d{4}-\d{2}-\d{2}$' then d.clave::date end as fecha,
           s.hora,
           case when s.hora ~ '^([01]\d|2[0-3]):[0-5]\d$' then s.hora::time end as hora_t,
           60 as minutos
    from semana,
         jsonb_each(case when jsonb_typeof(semana.h->'slots') = 'object'
                         then semana.h->'slots' else '{}'::jsonb end) as d(clave, horas),
         jsonb_array_elements_text(case when jsonb_typeof(d.horas) = 'array'
                                        then d.horas else '[]'::jsonb end) as s(hora)
  ),
  ocupados as (
    select left(t.fecha::text, 10) as fecha,
           case when t.hora ~ '^([01]{0,1}\d|2[0-3]):[0-5]\d' then substring(t.hora from '^\d{1,2}:\d{2}')::time end as desde,
           greatest(coalesce(t.duracion, 60), 1) as minutos
    from turnos t
  ),
  -- Horarios ya pedidos (sin responder) o propuestos por Pau en la última semana.
  pedidos as (
    select fecha, hora from pedidos_turno
    where estado = 'nuevo' and fecha is not null and created_at > now() - interval '7 days'
    union
    select fecha_prop, hora_prop from pedidos_turno
    where estado = 'propuesto' and fecha_prop is not null and created_at > now() - interval '14 days'
  )
  select distinct o.fecha, o.hora
  from ofrecidos o, ahora, semana
  where o.fecha is not null and o.hora_t is not null
    and o.fecha between ahora.t::date and ahora.t::date + 21
    and o.fecha + o.hora_t > ahora.t + interval '1 hour'
    and not (coalesce(semana.h->'diasActivos', '[]'::jsonb) @> jsonb_build_array('NO:' || o.fecha::text))
    and not (coalesce(semana.h->'tomados'->(o.fecha::text), '[]'::jsonb) @> jsonb_build_array(o.hora))
    and not exists (
      select 1 from ocupados x
      where x.fecha = o.fecha::text and x.desde is not null
        and o.hora_t < x.desde + make_interval(mins => x.minutos)
        and x.desde < o.hora_t + make_interval(mins => o.minutos)
    )
    and not exists (select 1 from pedidos p where p.fecha = o.fecha and p.hora = o.hora)
  order by o.fecha, o.hora;
$funcion$;

revoke all on function public.horarios_libres() from public;
grant execute on function public.horarios_libres() to anon, authenticated;

commit;

-- Para probar:
-- select * from public.horarios_libres();
-- select * from public.pedidos_turno order by created_at desc;
