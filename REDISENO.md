# Paupet — Plan del rediseño (para Claude Code)

Auditoría y propuesta aprobadas el 2026-10-04. Este archivo es la guía de trabajo: leelo entero junto
con `context.md` antes de tocar código. La maqueta de cada pantalla está en `docs/rediseno/*.dc.html`
(es HTML con los estilos en línea: copiá de ahí medidas, colores, textos y el orden de los elementos).

## Reglas que no se discuten

- **No se sacan** los emojis, las ilustraciones de Pau y del salchicha (`src/assets/ilustraciones/*`),
  los avatares por raza ni la animación del salchicha durmiendo (`EstadoVacio`). Al contrario: se usan más.
- Verde menta **#5FBF9B** con texto **#13302A** encima. Tipografías actuales (Outfit; Fraunces para títulos).
- Precio **siempre a mano**. Cobro **sólo efectivo o transferencia**, sin propina.
- Botones ≥ 44 px. Todo tiene que andar primero en el celular (390 px) y después en PC (≥ 1280 px).
- **No escribir en la base de producción.** Probar con `npm run demo`. Nada de `npm run dev` con datos reales.
- Trabajar en la rama `rediseno/fase-1`, **un commit por punto**. Después de cada punto:
  `npm run build && npm run lint && npm test`. Al terminar cada punto, marcarlo `[x]` acá y anotarlo en
  el registro de cambios de `context.md`.
- La Fase 1 **no cambia la base** (ni columnas ni tablas). Lo que necesite la base va a la Fase 2.

## Correspondencia con la maqueta

| Maqueta (`docs/rediseno/`) | Pantalla |
|---|---|
| `Hoy.dc.html` / `PcHoy.dc.html` | Hoy (celular / PC) |
| `Mesa.dc.html` | Modo mesa (turno en curso) |
| `Cobro.dc.html` | Cobrar |
| `Turno.dc.html` | Nuevo turno |
| `Agenda.dc.html` / `PcAgenda.dc.html` | Agenda (día en celular, semana en PC). Sábado 10 = día vacío |
| `Ficha.dc.html` | Ficha del perro |
| `Avisos.dc.html` | Bandeja de avisos |
| `Negocio.dc.html` / `PcFinanzas.dc.html` | Finanzas: Mes / Año / Historial |
| `Onboarding.dc.html`, `Reserva.dc.html` | Para la venta (Fase 3, no tocar ahora) |
| `Main.dc.html` | La auditoría completa |

Las imágenes de la maqueta aparecen como `/_blob/<id>`. Equivalencias:
`07fb09…` = `public/pau-avatar.png` · `a08896…` = `ilustraciones/pau-secador.webp` ·
`f4d7ac…` = `durmiendo.webp` · `eb55fd…` = `banio.webp` · `115c90…` = `enviado.webp` ·
`34de5d…` = `buscando.webp` · `10f396…` = `avatares/caniche.webp` · `5a8569…` = `golden.webp` ·
`a96722…` = `salchicha.webp` · `b9c02d…` = `yorkie.webp` · `dc162c…` = `ovejero.webp` · `2e77db…` = `mestizo.webp`.
En el código se usan los imports de siempre (`PetAvatar`, `EstadoVacio`, etc.), no esos links.

---

## Fase 1 — Limpiar y acelerar (sin cambios en la base)

**Regla de orden:** después de cada punto la app tiene que quedar completa y usable. Si un punto saca algo
de una pantalla y su lugar nuevo llega en un punto posterior, en ese mismo commit se deja un acceso
provisorio (nunca una función sin pantalla, sobre todo los pedidos de turno).

**Horarios libres (regla única para Hoy, Nuevo turno y Agenda):** una sola función que reuse
`lib/horariosLibres.js` con la misma regla que `/turnos` (lo cargado en Horarios para Stories menos lo
ocupado, según duración), excepto que para Pau **no** se descartan los horarios pedidos por clientes.
Si ese día no hay horarios cargados, no se muestran huecos (no se calculan "huecos" entre turnos).
Fuera de los 21 días que cubre, se usa un campo de hora.

### 0. Preparar
- [x] Commit de `REDISENO.md` y `docs/rediseno/` en la rama.
- [x] Adelantar dos arreglos del punto 10: el seed demo genera turnos para hoy sea el día que sea (hoy
      `npm test` falla los domingos) y `detectarCapacidades()` una sola vez al iniciar.

### 1. Menú nuevo
- [x] `lib/constants.js` → `NAV_ITEMS`: **Hoy · Agenda · Perros · Avisos · Finanzas** (los 5 en la barra del
      celular; se va el "Más"). Por ahora no hay gatos: "Perros" queda así.
- [x] Badge de Avisos = pedidos pendientes + recordatorios sin enviar (**no** suma "les toca volver": sería un
      número siempre alto que se deja de mirar). Se va el badge "N pend." de Agenda. Cuentan los pedidos sin responder o aceptados sin avisar (los "esperando respuesta" no: esperan al cliente).
- [x] Avisos se crea ya en este punto con las tarjetas actuales (`PedidosCard`, `ManianaCard`, `VuelvenCard`)
      movidas tal cual; el rediseño de la bandeja es el punto 6.
- [x] "Historial" y "Notas y gastos" dejan de ser secciones: hasta el punto 7, accesos provisorios desde
      Finanzas a esas pantallas como están hoy.
- [x] **Ajustes** (Configuración + Copia de seguridad + avisos al celular): en el celular desde el avatar de Pau
      en Hoy; en PC abajo del menú lateral. **Horarios para Stories** se abre desde Agenda (es la fuente de los
      huecos libres) y en PC también abajo del menú lateral. En el menú lateral de PC va el avatar de Pau arriba
      y `pau-secador.webp` abajo.
- [x] Se va el botón flotante sólo donde estorba; queda en Hoy y Agenda.

### 2. Hoy (`pages/dashboard/`)
- [x] Sacar de Hoy: la grilla de `KpiCard` (pasa a Finanzas), `InasistenciasCard` (pasa a la ficha y al dar
      turno), `RecordatorioRespaldo` y `AvisosCard` (pasan a Ajustes; `AvisosCard` compacta sólo si los avisos
      todavía no están activados en ese celular).
- [x] Encabezado: avatar de Pau (abre Ajustes) + saludo según la hora como hoy ("¡Buen día, Pau! ☀️" /
      "¡Buenas tardes…" / "¡Buenas noches…") + "Quedan N turnos 🐾".
- [x] `ProximoTurnoCard` → tarjeta clara "AHORA · 10:00–11:30": avatar, nombre, raza · servicio · dueño, las
      etiquetas de alergia/cuidados bien visibles, y dos botones: **Está listo** (WhatsApp `abrirWhatsAppListo`)
      y **Cobrar**. Tocar la tarjeta abre el Modo mesa (punto 3); hasta entonces, la ficha del perro.
- [x] `AgendaHoyCard` → "el resto del día" con avatar por fila y **los huecos libres** (regla única de arriba)
      como filas "Libre 1 h 30 · dar turno" (abre Nuevo turno con fecha y hora).
- [x] Una sola fila oscura "N mensajes para mandar" → lleva a Avisos. Se van `ManianaCard`, `VuelvenCard` y
      `PedidosCard` de Hoy (su lógica se reusa en Avisos).
- [x] PC (`PcHoy`): dos columnas — turno en curso + resto del día a la izquierda; pedido nuevo y "Para mandar 💬"
      a la derecha.

### 3. Modo mesa (nuevo)
- [ ] Pantalla/modal a pantalla completa al tocar el turno en curso: avatar grande, "EN LA MESA · DESDE LAS 10:00",
      alertas en grande (rosa alergias, ámbar cuidados), "Cómo lo dejamos": última visita, fotos de antes/después
      más recientes (`FotosAntesDespues`/`db.getFotos`) y las notas del perro. Abajo, fijos: **Está listo 🐾** y
      **Cobrar $X**.
- [ ] La "receta de corte" (cuchilla, largo, estilo) necesita columna nueva → Fase 2. Por ahora se muestran las notas.

### 4. Cobrar (`pages/calendario/ModalCobro.jsx`)
- [ ] Monto: **se escribe el monto nuevo** con un teclado numérico grande en pantalla (1–9, 000, 0, borrar),
      arranca vacío. En PC también se puede escribir con el teclado de la compu. Chip "Igual que la última
      vez · $X" (la última visita, como en `ClienteResumen`).
- [ ] **Tocar Efectivo o Transferencia guarda** (llama a `onCobrar`). Sin monto, no hace nada. Se va el botón
      "Cobrar $X" separado y el campo "Qué se le hizo" pasa a una línea editable chica arriba.
      Requiere cambiar `handleCobrar` (`hooks/useTurnoActions.js`): hoy cierra la ventana al guardar.
- [ ] Después de cobrar, en la misma ventana: `banio.webp`, "¡Cobrado $X! ✅", "Deshacer" (borra la visita
      creada y devuelve el turno a su estado anterior; sin cambios en la base), y
      "PRÓXIMO TURNO · VIENE CADA ~N SEMANAS" con la fecha de `fechaSugerida` (sigue sin proponer domingos:
      Pau trabaja sólo algunos) y la misma hora del turno cobrado: **Agendar 📅** / Ahora no /
      Otro día u horario. Reemplaza al checkbox actual.
- [ ] "No vino" queda como link chico abajo.

### 5. Nuevo turno en 3 toques (`pages/calendario/ModalTurno.jsx`)
- [ ] Orden: **1 · Perro** (buscador, ya existe en `ClienteSelector`) → **2 · Servicio** (chips con
      `serviciosFrecuentes`, preseleccionado el de la última visita) → **3 · Cuándo** (chips de días y chips de
      horarios libres de ese día). Botón "Agendar · Jue 8 10:30".
- [ ] Sacar del formulario: **Forma de pago** y **Estado** (siempre confirmado; se van también los contadores
      de "sin confirmar"). Precio y duración van en "Más opciones" plegado; la duración sale sola del último
      turno de ese perro con ese servicio, si no hay, del último de cualquier perro con ese servicio, y si no, 60 min.
- [ ] Horarios libres: la regla única de arriba (`lib/horariosLibres.js`, `ayudaTurno.turnosQueSePisan`).
      Si no hay, un campo de hora como hoy. Lo automático es Fase 2.

### 6. Avisos (nuevo: `pages/avisos/`)
- [ ] Una sola bandeja: **Pedidos de turno** (Aceptar / Otro horario, lógica de `PedidosCard` y
      `usePedidoActions`), **Recordar · <próximo día con turnos>** (lógica de `ManianaCard` + `lib/avisados.js`)
      y **Les toca volver** (`clientesParaVolver`, con el menú de pausar que ya existe).
- [ ] Botón grande "Enviar a <perro> (1 de N)" que abre el WhatsApp del siguiente y lo marca enviado.
- [ ] Cuando no queda nada: `enviado.webp` + "¡Todo enviado! 💌".

### 7. Finanzas (`pages/finanzas/`)
- [ ] Tres pestañas: **Mes · Año · Historial**.
- [ ] **Mes**: tarjeta oscura "Te queda en <mes>" (cobrado − gastos), barra efectivo/transferencia, agendado por
      cobrar; botón "🛒 Anotar un gasto o compra"; abajo los accesos a Ajustes. La lista de compras (hoy en Notas)
      queda dentro de "Gastos y compras".
- [ ] **Año (nuevo)**: cobrado del año + variación contra el mismo período del año anterior; barras por mes
      (color ingresos `#3FA380`, el mes en curso más claro, tooltip con el monto); tarjetas de gastos, te queda,
      mejor mes, servicios, ticket promedio y clientes nuevos; **tabla mes a mes** (servicios, efectivo,
      transferencia, cobrado, gastos, te queda, fila de total); "Descargar resumen del año" (CSV que abra bien
      en Excel). Reusar `finanzasCalc.js` (`serieMeses`, `calcResumenMes`, `csvDelMes`).
- [ ] **Historial**: cobros (visitas) y gastos (notas tipo egreso) juntos, del más nuevo al más viejo,
      buscador, filtros **Todo / Efectivo / Transferencia / Gastos** y total de lo filtrado. Absorbe
      `pages/historial/` (su lógica de "turno completado sin visita" se mantiene).
- [ ] PC (`PcFinanzas`): todo en una página — resumen del año, gráfico + tarjeta del mes, tabla anual e historial.

### 8. Agenda (`pages/calendario/`)
- [ ] Celular: los días arriba como botones (lunes a domingo, ya hecho en main); huecos libres (regla única)
      con borde punteado "Libre · dar turno".
- [ ] **Día sin turnos**: `EstadoVacio` con el salchicha durmiendo (respira + z) + "El <día> no hay turnos 💤" +
      botón "Ver a quién avisar 🐾" (→ Avisos) y "Dar un turno".
- [ ] PC: semana con panel lateral del turno elegido (cobrar, WhatsApp, mover). Ya existe casi todo.

### 9. Ficha del perro (`pages/clientes/ModalCliente.jsx`)
- [ ] En el celular, pantalla en vez de ventana de 1000 px. Orden: cabecera (avatar, raza, dueño, otros perros),
      WhatsApp + **Dar turno**, línea de frecuencia, etiquetas + "Faltó N veces", fotos, últimas 3 visitas y
      "Ver las N visitas · último aumento hace X". Editar/Eliminar en el menú ⋯ (ya está).

### 10. Limpieza
- [ ] Configuración: sacar de la pantalla "Horarios base", "Días de anticipación" y "Mensaje" (no los usa nada
      desde la migración 5). **No** borrar las columnas.
- [ ] Textos de ayuda largos → una línea o nada.
- (Los arreglos del seed demo los domingos y de `detectarCapacidades()` se adelantaron al punto 0.)

---

## Fase 2 — Cambios en la base (cada uno: migración nueva + copia de seguridad antes)
- [ ] Estados de turno **no vino** y **canceló** (hoy "No vino" borra el turno). Historial de faltas y aviso de
      seña a quien falta seguido.
- [ ] **Receta de corte** por perro (cuchilla, largo, estilo, foto del después) en la ficha y el Modo mesa.
- [ ] **Jornada laboral** (días, desde, hasta, perros a la vez) en config → huecos libres automáticos para la
      agenda, la Story y `horarios_libres()` (un solo sistema de horarios).
- [ ] Confirmación por link en el recordatorio (Confirmo / No puedo ir).
- [ ] Dueño con varios perros (tabla de dueños).
- [ ] Plantillas de WhatsApp editables. Stock con cantidad mínima.
- [ ] Actualizar sólo lo que cambió en vez de recargar todo después de cada acción; copia de seguridad automática.

## Fase 3 — Para venderla (no empezar sin hablarlo)
Multi-peluquería (`negocio_id` + RLS por negocio), sacar lo de Pau del código a la configuración, alta
(`Onboarding`), página de reservas por peluquería (`Reserva`), suscripción, marca, términos y privacidad,
varios peluqueros por negocio.
