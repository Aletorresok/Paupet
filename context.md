# Paupet — Contexto y plan de trabajo

Documento vivo: se actualiza a medida que avanzamos. Marcar `[x]` al completar.

## Qué es Paupet

Panel de gestión para una peluquería canina (React 18 + Vite + Supabase).
Secciones: Panel de control, Clientes, Calendario de turnos, Historial, Notas & Stock,
Horarios (imagen para Stories) y Configuración.

Tablas Supabase usadas: `clientes`, `visitas`, `turnos`, `notas`, `config` (fila id=1),
bucket de storage `fotos`.

## Decisiones de la dueña (2026-09-23)
- **Fases 0 y 1**: de acuerdo al 100%.
- **Precios: siguen siendo a mano.** No se estandarizan (dependen del perro, su estado y el dueño).
  Un catálogo, si se hace, es sólo de nombres de servicio (y quizás duración), sin precio.
- **Cobro: sólo efectivo o transferencia. No hay propina.**
- **Frecuencia de vuelta de cada cliente + aviso cuando está por pasarse: CLAVE.**
- **El verde menta (#5fbf9b) es indispensable.** Todo el resto de la estética es negociable.
- **Pedido de turnos (reemplaza al portal de reservas)** — HECHO en la versión nueva: `/turnos`, pública.
  Arma un mensaje de WhatsApp para Pau (+54 9 11 6801-9061); ella confirma a mano. No escribe en la base.
  Muestra los horarios libres vía `horarios_libres()` (migración 3, `security definer`, sólo fecha/hora):
  lo guardado en "Horarios para Stories" (cualquiera de las dos versiones), sin días apagados, tomados,
  ni los que se pisan con un turno (según su duración). Sin horarios o sin migración 3 → texto libre.
  Código: `src/pages/turnos/*`, link para copiar en Horarios (`LinkTurnosCard`), `vercel.json` (rewrite SPA).
  Maqueta: https://claude.ai/artifact/7zKUNXftKQc6LQrYnidLmU

## Versión nueva en paralelo
- **Anterior (la que se usa hoy):** `main` → https://paupet.vercel.app (producción en Vercel). No se toca.
- **Nueva (en prueba):** rama `claude/tender-wozniak-n0x9av` → https://paupet-nueva.vercel.app
  Muestra un aviso arriba con link "Volver a la versión anterior".
- **Comparten la misma base de datos Supabase** → lo que se carga en una aparece en la otra.
- ⚠️ **Regla de compatibilidad:** mientras convivan, la nueva NO puede cambiar la forma de los datos
  de manera que la anterior se rompa o muestre cosas raras. Permitido: leer distinto, calcular cosas
  nuevas, agregar columnas/tablas que la anterior ignora. Prohibido: estados nuevos en `turnos.estado`,
  renombrar/borrar columnas, mover datos de tabla.
  → Por eso "No vino como estado" y "dueño con varios perros" quedan para cuando se pase a la nueva.
- ⚠️ La Fase 0 (activar RLS) rompe la versión anterior si no se cambia también su login: hay que
  aplicar el login nuevo en **las dos** versiones antes de activar RLS.

## Estructura objetivo (Fase 2)

```
src/
  main.jsx                  entrada
  App.jsx                   gate de login → AppShell
  AppShell.jsx              layout + hooks de estado
  AppPages.jsx              router simple de la página activa
  AppModals.jsx             modales globales
  lib/
    supabase.js             cliente Supabase
    db.js                   capa de datos (todas las queries)
    constants.js            meses, días, config por defecto, nav
    utils.js                fechas, formato de precios, íconos
    whatsapp.js             abrirWhatsApp
    styles.js               estilos compartidos (inputStyle, card…)
  context/
    resp.js                 RespCtx + useResp
    RespProvider.jsx        provider responsive
  hooks/
    useToasts.js            toasts
    useConfirm.js           diálogo de confirmación con promesa
    usePaupetData.js        estado global + loadAll
    useModals.js            estado de los modales
    useClienteActions.js    handlers de clientes/visitas
    useTurnoActions.js      handlers de turnos
    useNotaActions.js       handlers de notas
    useConfigActions.js     handlers de config/horarios
  components/
    ui/                     Btn, Badge, Modal, ModalHead, FormGroup, Spinner,
                            ConfirmDialog, ToastContainer, SearchInput, PagoSelect,
                            MonthSelect, PageHeader, PetAvatar, WhatsAppBtn, Table
    layout/                 Sidebar, SidebarBrand, SidebarNavItem, MobileHeader, GlobalStyles
  pages/
    dashboard/              Dashboard, StatCard, TurnosHoyCard, TurnoHoyItem,
                            InasistenciasCard, dashboardStats
    clientes/               ClientesPage, ClienteCard, ModalCliente, ClienteDatos,
                            InasistenciasBanner, VisitaItem, VisitaForm,
                            ModalClienteForm, FotoPicker
    calendario/             CalendarioPage, MonthNav, CalendarLegend, CalendarGrid,
                            CalendarDay, DiaTurnosPanel, TurnoCard, ModalTurno,
                            ClienteSelector
    historial/              HistorialPage, HistorialTable, HistorialCards, useHistorial
    notas/                  NotasPage, ComprasTab, CompraItem, EgresosTab,
                            EgresosList, ModalNota
    horarios/               HorariosPage, useHorariosSemana, SemanaNav, DiaSlotsCard,
                            SlotRow, StoryPreview, StoryDayCard, AutoGenModal,
                            horariosUtils
    config/                 ConfigPage, ConfigGeneral, DiaConfigCard, SlotChip,
                            NuevoSlotForm, Toggle
    login/                  LoginPage
```

Reglas del refactor:
- **Sin cambios de comportamiento ni visuales.** Los bugs conocidos se arreglan en la Fase 1, aparte.
- Un componente por archivo; componentes chicos (idealmente < 150 líneas).
- Estilos repetidos → `lib/styles.js` o componentes UI compartidos.
- Validar con `npm run build` después de cada paso.

## Fases

### Fase 0 — Seguridad (pendiente, requiere acceso al panel de Supabase)
> El repo es **público** en GitHub: el código que lee la contraseña desde `config` está a la vista.
- [x] Login con Supabase Auth en la versión nueva (`hooks/useSession.js`, `pages/login/LoginPage.jsx`)
- [x] Mismo login para la versión anterior: PR https://github.com/Aletorresok/Paupet/pull/1 (rama `claude/login-seguro`, **sin mergear**)
- [x] Script `supabase/seguridad.sql`: RLS sólo para `authenticated` en las 5 tablas, `revoke` a `anon`,
      borra `password_hash`, escritura del bucket `fotos` sólo para logueados
- **Pasos para la dueña (en este orden):**
  1. [ ] Supabase → Authentication → Users → Add user (uno por persona, "Auto Confirm User")
  2. [ ] Supabase → Authentication → Sign In / Providers → desactivar "Allow new users to sign up"
         (si no, cualquiera con la clave pública podría crearse un usuario y entrar)
  3. [ ] Mergear el PR #1 → Vercel publica el login nuevo en paupet.vercel.app → probar entrar
  4. [ ] Correr `supabase/seguridad.sql` en el SQL Editor
  5. [ ] Probar las dos versiones
- ⚠️ Con RLS activo, el portal de reservas (si se retoma) necesitará sus propias políticas para `anon`.

### Fase 1 — Bugs de datos
- [x] `todayStr()` usa UTC → fecha local (`toISODate`, `parseFecha`, `diasDesde` en `lib/utils.js`)
- [x] Duplicados de clientes: ahora se fusionan en memoria (visitas sumadas, turnos re-asociados vía `aliasIds`). La base no se toca
- [x] Completar turno: `db.completarTurno` sólo marca si no estaba completado (evita visita duplicada por doble click / dos dispositivos); si falla la visita, el turno vuelve a su estado
- [ ] "No vino" borra el turno → usar estado `no_show` — **postergado** (rompe compatibilidad con la versión anterior)
- [x] Switch Abierto/Cerrado en Configuración ahora funciona (botón accesible)
- [x] Historial: las visitas nunca se descartan; un turno completado sólo aparece si no tiene su visita
- [x] "Hace X días" con desfase por UTC
- [x] `ConfirmDialog` cancelar resuelve la promesa con `false`
- [x] Búsqueda de clientes no rompe si `dog`/`owner` es null
- [x] Modal: ancho `min(Npx, 95vw)`
- [x] Visitas del perfil ordenadas por fecha
- [ ] Unificar los dos sistemas de horarios — **en pausa** (depende de si se hace el portal)

### Fase 2 — Estructura ✅ (división de `App.jsx`)
- [x] Crear estructura de carpetas, mover `supabase.js` a `lib/`
- [x] `lib/` (constants, utils, whatsapp, db, styles)
- [x] Contexto responsive y hooks (datos, modales, acciones por dominio)
- [x] Componentes UI compartidos
- [x] Layout (Sidebar, SidebarBrand, SidebarNavItem, MobileHeader, GlobalStyles)
- [x] Páginas divididas en subcomponentes
- [x] `AppShell` + `AppPages` + `AppModals` + `App.jsx` mínimo
- [x] Build OK + smoke test con Playwright en desktop y mobile: 0 errores JS,
      capturas idénticas píxel a píxel a la versión anterior en las 7 páginas
- [x] ESLint funcionando (se agregaron `@eslint/js`, `globals`; `react-hooks` v7). `npm ci` ya no necesita `--legacy-peer-deps`
- [ ] Migrar el patrón "setState dentro de useEffect" para resetear formularios de modales
      (hoy es warning `react-hooks/set-state-in-effect`; 7 casos) → usar `key` en el modal
- [ ] Mover estilos inline a CSS (se hace junto con la Fase 3 de tokens)

### Fase 3 — Rediseño visual (en curso, según la maqueta aprobada)
- [x] Tokens de diseño en `lib/styles.js` (`C.*`): menta #5FBF9B con texto #13302A, grises con contraste AA
- [x] Tipografía Fraunces (títulos) + Outfit (texto, números tabulares)
- [x] Íconos de línea (`components/ui/Icon.jsx`) en menú y botones (quedan emojis en algunos textos)
- [x] Menú lateral claro con secciones "Día a día" / "Negocio"
- [x] Celular: barra inferior Hoy/Agenda/Clientes/Más + botón flotante "Nuevo turno" (reemplaza al menú hamburguesa)
- [x] Botones ≥ 44px (tamaño normal), badges y modales nuevos
- [x] Panel "Hoy": saludo, KPIs (ingresos efectivo/transferencia, ganancia neta = ingresos − gastos, servicios + ticket, sin confirmar),
      próximo turno destacado, agenda de hoy, "Ya les toca volver", recordatorios de mañana por WhatsApp, inasistencias
- [x] Ventana "Completar y cobrar": qué se hizo, monto a mano, efectivo/transferencia, aviso de frecuencia.
      Guarda turno + visita con lo cobrado (columnas existentes: compatible con la versión anterior)
- [x] Agenda: vistas Semana (escritorio) / Día (celular) / Mes. Turnos con alto según duración,
      superposiciones marcadas en rosa + aviso, tocar un horario libre abre "Nuevo turno" con fecha y hora
      (`pages/calendario/semana/`). Campo "Duración" en el turno
- [x] Ficha de cliente nueva (`pages/clientes/ficha/`): acciones (dar turno, WhatsApp, editar, eliminar),
      otros perros del mismo dueño (mismo nombre o teléfono, sin cambiar la base), frecuencia + "Agendar",
      datos y totales, etiquetas con colores (alergia rosa / cuidados ámbar), fotos de antes y después, historial
- [ ] **Migración 2 pendiente de correr** (`supabase/migracion_02_agenda_ficha.sql`): `turnos.duracion`,
      `clientes.etiquetas`, tabla `fotos_cliente`. La app detecta si existe (`db.detectarCapacidades`) y
      mientras no, usa 60 min y oculta etiquetas/fotos
- [x] Página de Finanzas (`pages/finanzas/`): mes navegable, KPIs (ingresos con variación, gastos, ganancia neta
      con margen, ticket), ingresos vs gastos últimos 6 meses (hover + tabla), efectivo vs transferencia,
      lo que más se vende, gastos por categoría, lista de compras pendiente, exportar CSV.
      Colores de gráficos validados (daltonismo/contraste): ingresos #3FA380, gastos #C2862B, transferencia #2D5DA8
- [x] Login con el diseño de la maqueta (panel verde en escritorio, compacto en celular)
- [ ] Skeletons y empty states; `lang="es"`, título y favicon en `index.html`

### Fase 4 — Funcionalidades
- [ ] Modelo dueño → varios perros (requiere migrar datos: después de pasar a la versión nueva)
- [ ] ~~Catálogo con precios por tamaño~~ → sólo lista de servicios frecuentes para autocompletar el nombre; **precio siempre a mano**
- [ ] Agenda día/semana con duraciones y detección de solapes
- [ ] Cobro al completar: monto final (a mano) + **efectivo / transferencia**. Sin propina
- [ ] Estados de turno completos (pendiente/confirmado/completado/no vino/cancelado) — después de la migración
- [ ] Recordatorios de WhatsApp en lote
- [x] **Frecuencia de vuelta** (`lib/frecuencia.js`): mediana de los últimos 5 intervalos entre visitas
      (ignora visitas a menos de 7 días, p. ej. uñas). Aviso "le toca pronto" 7 días antes.
  - [x] Tarjeta "Ya les toca volver" en el Panel (sin turno agendado) con WhatsApp de invitación
  - [x] Badge de la tarjeta de cliente según frecuencia (verde / naranja pronto / rosa se pasó)
  - [x] Perfil: "Viene cada ~N semanas · próxima estimada · le toca en X días"
  - [ ] Sugerir el próximo turno al completar uno
  - [ ] Ajustar el umbral de aviso (hoy 7 días) según lo que diga la dueña
- [ ] Finanzas: ganancia neta, gráfico mensual, export CSV
- [ ] Stock con cantidad mínima
- [ ] PWA instalable

## Maqueta (referencia visual para Fases 3 y 4)
https://claude.ai/artifact/2TqCWXt7HKh2mirih6uZWy
- Paleta: fondo #F7F4EF · tinta #1F2A26 · tinta suave #5B6661 · salvia #2F7A5F · salvia profundo #1F3A31 · rosa #B83D62 · ámbar #8A5300 · línea #E6E0D8
- ✅ Ajustado (v4): **verde menta #5FBF9B** como color principal con texto oscuro #13302A encima (contraste 6,5:1); bordes de selección #3FA380;
  sólo efectivo/transferencia, sin propina; precio siempre a mano (con referencia "la última vez le cobraste…");
  "Servicios frecuentes" sin precios fijos (sólo rango cobrado, informativo).
- ✅ La dueña aprobó la maqueta ("espectacular"). Falta el feedback de Pau (la usuaria real).

## Imagen de Horarios para Stories
- **Clásico** (el de siempre, a Pau le gusta): se conserva tal cual (`StoryPreview.jsx`).
- **Nuevo** (de la maqueta): `StoryPreviewNuevo.jsx` — fondo menta, "Turnos libres", sólo horarios libres
  por día ("Completo" si no queda ninguno), ilustración de la peluquera con el salchicha abajo.
- Se elige con el selector Clásico / Nuevo ✨ arriba de la vista previa; el dispositivo recuerda la última elección.
- Pendiente: decidir con Pau cuál queda (o ajustes al nuevo).
- Tipografía: Fraunces (títulos) + Outfit (texto, números con `tabular-nums`)
- Íconos de línea (tipo Lucide) en vez de emojis; botones ≥ 44px
- Navegación: menú lateral claro en escritorio; barra inferior (Hoy/Agenda/Clientes/Más) + botón flotante en celular
- Los datos de la maqueta son de ejemplo

## Copias de seguridad
- El plan gratis de Supabase no tiene copias restaurables → botón **Configuración → Copia de seguridad**
  (`lib/respaldo.js`): descarga un JSON con todas las tablas tal cual (clientes, visitas, turnos, notas,
  config y fotos_cliente si existe). Recordatorio en el panel si pasaron más de 7 días (por dispositivo).
- Restaurar: todavía manual (pedírselo a Claude con el archivo).
- Todas las lecturas usan `traerTodo()` (tandas de 1000): antes, pasando las 1000 filas, los turnos
  más nuevos dejaban de aparecer.
- La misma corrección se pasó a la versión anterior (`main`) en el PR #2 (`claude/paginacion-main`).

## Incidente 2026-09-23 (falsa alarma)
- Parecía que faltaban clientes/turnos de la semana. Verificado en Supabase: los clientes estaban (hasta id 112)
  y no había turnos después del 18/9 porque Pau no había cargado ninguno. Faltan ids 94 y 96 (antiguos).
- Se encontró y arregló: la vista Semana ocultaba turnos sin hora.

## Preguntas abiertas
- Portal de reservas: a medio hacer, sin decidir si se hace.
- ¿Protección de previews de Vercel activada? Si sí, la novia necesitaría login de Vercel: desactivarla o asignar un dominio a la rama.

## Cómo validar
- `npm ci && npm run build && npm run lint`
- Smoke test: `npx vite preview` + Playwright, recorriendo las 7 páginas en 1280px y 390px.

## Registro de cambios
- 2026-09-23 — Análisis inicial y plan. Inicio Fase 2 (división de `App.jsx`).
- 2026-09-23 — Fase 2: `App.jsx` (2.286 líneas) dividido en ~75 archivos chicos (el más grande: `db.js`, 172 líneas). Sin cambios visuales ni de comportamiento. ESLint arreglado.
- 2026-09-23 — Maqueta del rediseño publicada: https://claude.ai/artifact/2TqCWXt7HKh2mirih6uZWy (14 pantallas: escritorio, ventanas, celular y guía de estilo). Pendiente de ajustes con la dueña.
- 2026-09-23 — Decisiones de la dueña registradas. Setup de versión en paralelo (aviso + link a la anterior). Fase 1 compatible hecha. Frecuencia de vuelta implementada.
- 2026-09-23 — Fase 0 preparada: login con Supabase Auth en ambas versiones (PR #1 para `main`), script RLS. Maqueta v4 con menta y sin propina/MP/precios fijos.
- 2026-09-23 — Imagen de Horarios: diseño nuevo agregado como opción, el clásico se mantiene.
- 2026-09-23 — Seguridad aplicada (PR #1 mergeado, RLS activo, verificado por la dueña). Versión nueva en https://paupet-nueva.vercel.app.
- 2026-09-23 — Rediseño aplicado en la app: estilos, menú, navegación móvil, panel Hoy y ventana de cobro.
- 2026-09-23 — Agenda semanal con duraciones y ficha de cliente nueva. Migración 2 escrita (falta correrla).
- 2026-09-23 — Finanzas y login nuevo. Con esto están todas las pantallas de la maqueta.
- 2026-09-23 — Copia de seguridad descargable + recordatorio semanal; lecturas paginadas (sin límite de 1000).
