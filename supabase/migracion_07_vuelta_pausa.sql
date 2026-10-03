-- ════════════════════════════════════════════════════════════════════
--  Paupet · Migración 7: sacar perros de "Ya les toca volver"
--  Correr UNA vez en Supabase → SQL Editor. Se puede volver a correr.
--
--  Hasta qué fecha no se le recuerda a Pau que un perro tiene que volver
--  ("Ya le escribí", "Ocultar 15 días", ...). 9999-12-31 = no mostrar más.
--  Vacío = se muestra normalmente. Mientras no se corra, la app no ofrece la opción.
-- ════════════════════════════════════════════════════════════════════

alter table public.clientes add column if not exists vuelta_pausa date;
