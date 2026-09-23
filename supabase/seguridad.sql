-- ════════════════════════════════════════════════════════════════════
--  Paupet · Seguridad (Fase 0)
--  Correr UNA vez en Supabase → SQL Editor, DESPUÉS de:
--    1. Crear los usuarios en Authentication → Users → "Add user"
--       (marcar "Auto Confirm User").
--    2. Desactivar el registro público: Authentication → Sign In / Providers
--       → "Allow new users to sign up" = OFF.
--    3. Publicar el login nuevo en la versión anterior (main) y comprobar
--       que se puede entrar con email y contraseña.
--  Resultado: sólo los usuarios logueados pueden leer o modificar datos.
--  Con la clave pública del código (la "anon") ya no se accede a nada.
-- ════════════════════════════════════════════════════════════════════

begin;

-- 1) Borrar las políticas existentes de las tablas de la app
--    (si alguna dejaba entrar a "anon", seguiría abierta).
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('clientes', 'visitas', 'turnos', 'notas', 'config')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) Activar RLS y permitir todo sólo a usuarios autenticados.
do $$
declare t text;
begin
  foreach t in array array['clientes', 'visitas', 'turnos', 'notas', 'config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy "equipo_paupet" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 3) La contraseña vieja guardada en texto plano ya no se usa: se borra.
alter table public.config drop column if exists password_hash;

commit;

-- 4) Fotos (bucket "fotos"): se siguen VIENDO por su link público, pero sólo
--    usuarios logueados pueden subir, cambiar o borrar.
--    Si este bloque da "must be owner of table objects", hacerlo desde
--    Storage → fotos → Policies (borrar las políticas que permitan a "anon"
--    o "public" hacer INSERT/UPDATE/DELETE y crear una para "authenticated").
begin;
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%''fotos''%'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "equipo_paupet_fotos" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos') with check (bucket_id = 'fotos');
commit;

-- 5) Verificación: todas deben decir rowsecurity = true y tener sólo "equipo_paupet".
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('clientes', 'visitas', 'turnos', 'notas', 'config');

select tablename, policyname, roles, cmd from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename;
