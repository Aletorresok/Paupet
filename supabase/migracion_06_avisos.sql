-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 6: avisos al celular (notificaciones push)
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr.
--
--  Guarda los celulares donde se activaron los avisos ("Activar avisos" en la app).
--  Cuando entra un pedido de turno, el aviso lo manda la función de Vercel
--  (api/aviso-pedido.js), que lee esta tabla con la clave de servicio.
--  Nadie de afuera puede leerla ni escribirla.
-- ════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.push_suscripciones (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  endpoint    text not null unique,   -- dirección del celular en el servicio de avisos (Google)
  p256dh      text not null,
  auth        text not null,
  usuario     text not null default '',  -- email de quien lo activó
  dispositivo text not null default ''
);

alter table public.push_suscripciones enable row level security;
revoke all on public.push_suscripciones from anon;
drop policy if exists "equipo_paupet" on public.push_suscripciones;
create policy "equipo_paupet" on public.push_suscripciones
  for all to authenticated using (true) with check (true);

commit;

-- Para ver los celulares con avisos activados:
-- select usuario, dispositivo, created_at from public.push_suscripciones;
