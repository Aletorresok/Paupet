# Paupet — Contexto y plan de trabajo

Documento vivo: se actualiza a medida que avanzamos. Marcar `[x]` al completar.

## Qué es Paupet

Panel de gestión para una peluquería canina (React 18 + Vite + Supabase).
Secciones: Panel de control, Clientes, Calendario de turnos, Historial, Notas & Stock,
Horarios (imagen para Stories) y Configuración.

Tablas Supabase usadas: `clientes`, `visitas`, `turnos`, `notas`, `config` (fila id=1),
bucket de storage `fotos`.

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
- [ ] Reemplazar login por Supabase Auth (email + contraseña)
- [ ] Activar RLS en todas las tablas (solo usuarios autenticados)
- [ ] Borrar `password_hash` en texto plano de `config`
- [ ] Revisar políticas del bucket `fotos`

### Fase 1 — Bugs de datos
- [ ] `todayStr()` usa UTC → fecha local (después de las 21 hs "hoy" es mañana)
- [ ] Duplicados de clientes: se ocultan en `getClientes` y se pierden sus visitas
- [ ] Completar turno no atómico / doble click duplica visita
- [ ] "No vino" borra el turno → usar estado `no_show`
- [ ] Switch Abierto/Cerrado en Configuración no funciona (`toggleDayOpen` sin uso)
- [ ] Historial deduplica servicios legítimos (perro+fecha+servicio)
- [ ] "Hace X días" con desfase por UTC
- [ ] `ConfirmDialog` cancelar no resuelve la promesa
- [ ] Búsqueda de clientes rompe si `dog`/`owner` es null
- [ ] `Math.min(width,'95vw')` = NaN en Modal
- [ ] Unificar los dos sistemas de horarios (Configuración vs Horarios)

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

### Fase 3 — Rediseño visual
- [ ] Tokens de diseño (CSS variables) y contraste AA
- [ ] Íconos consistentes (Lucide) en vez de emojis
- [ ] Navegación inferior en mobile + FAB "Nuevo turno"
- [ ] Botones táctiles ≥ 44px
- [ ] Dashboard: próximo turno, timeline del día, mini gráfico
- [ ] Calendario con chips (hora + nombre) en desktop
- [ ] Skeletons y empty states
- [ ] `lang="es"`, título, favicon, fuentes en `index.html`

### Fase 4 — Funcionalidades
- [ ] Modelo dueño → varios perros
- [ ] Catálogo de servicios con precio/duración por tamaño
- [ ] Agenda día/semana con duraciones y detección de solapes
- [ ] Cobro al completar (monto final, medio de pago, propina)
- [ ] Estados de turno completos (pendiente/confirmado/completado/no vino/cancelado)
- [ ] Recordatorios de WhatsApp en lote
- [ ] "Clientes para llamar" según frecuencia
- [ ] Finanzas: ganancia neta, gráfico mensual, export CSV
- [ ] Stock con cantidad mínima
- [ ] PWA instalable

## Preguntas abiertas
- ¿Existe el portal público de reservas (`from_portal`, slots de Configuración) en otro repo?

## Cómo validar
- `npm ci && npm run build && npm run lint`
- Smoke test: `npx vite preview` + Playwright, recorriendo las 7 páginas en 1280px y 390px.

## Registro de cambios
- 2026-09-23 — Análisis inicial y plan. Inicio Fase 2 (división de `App.jsx`).
- 2026-09-23 — Fase 2: `App.jsx` (2.286 líneas) dividido en ~75 archivos chicos (el más grande: `db.js`, 172 líneas). Sin cambios visuales ni de comportamiento. ESLint arreglado.
- 2026-09-23 — En curso: maqueta interactiva de los cambios propuestos (Fases 3 y 4).
