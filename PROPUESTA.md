# Propuesta de mejoras — Paupet (rama `propuesta/mejoras`)

Rama **local** creada a partir de `claude/tender-wozniak-n0x9av` (Paupet-nueva). **No se subió a GitHub,
no se tocó `main` ni la base de Supabase.** Cada mejora es un commit aparte, así que se puede quedar con
algunas y descartar otras.

## Cómo probarlo

```bash
npm run demo
```

Abre la app con **datos ficticios** (36 perros, un año de visitas, turnos de hoy y de las próximas semanas,
gastos y horarios publicados). Todo se guarda sólo en el navegador y arriba aparece una franja naranja
"MODO DEMO" con un botón para reiniciar los datos. Con `npm run dev` se ve con los datos reales, como siempre
(ojo: ahí sí escribe en la base).

## Cómo revertir

- Todo: `git checkout claude/tender-wozniak-n0x9av` y `git branch -D propuesta/mejoras`.
- Una mejora sola: `git revert <commit>` (la lista de commits está en cada punto).
- Tu `Context.md` de `main`, que no estaba commiteado, quedó guardado como `Context.main-backup.md`
  (en Windows chocaba con el `context.md` de la rama nueva).

## Reglas que respeté (del `context.md`)

- **Compatibilidad con la versión anterior:** no hay columnas, tablas ni estados nuevos. Todo se calcula con los
  datos que ya existen, y lo que necesita guardarse aparte (recordatorios enviados) queda en el dispositivo.
- Precio **siempre a mano**; sólo **efectivo/transferencia**; se mantiene el **menta #5FBF9B**.

---

## ✅ Hecho en la rama (18)

### Servicio y día a día

1. **Horarios para Stories ↔ Agenda** — Los horarios que ya tienen turno en la Agenda se marcan solos como
   tomados (con el nombre del perro), en el editor y en la imagen. Antes había que tacharlos a mano, y la
   imagen podía ofrecer un horario que la página /turnos ya no mostraba. No cambia lo guardado: si el turno se
   borra, el horario vuelve a quedar libre. `fcb0ac7`
2. **Sugerir el próximo turno al cobrar** (pendiente en `context.md`) — En "Completar y cobrar" aparece
   "Después, agendar el próximo turno: 28 de octubre" (según cada cuánto viene; a 4 semanas si es nuevo).
   Al cobrar se abre "Nuevo turno" ya cargado (fecha, hora, servicio, duración). No se ofrece si ya tiene otro
   turno. `9e59514`
3. **Lo que hay que saber del perro al darle turno** — Al elegir el cliente se ven sus etiquetas
   (alergias en rosa, cuidados en ámbar), cuántas veces faltó, sus notas y **"La última vez (hace 32 días):
   Baño y corte · $19.000"**, con un botón "Usar lo mismo" (el precio se puede cambiar). `9e59514`
4. **Buscador de clientes en "Nuevo turno"** — Antes era un desplegable con todos los perros. Ahora se
   escribe el perro, el dueño o el teléfono (sin importar las tildes); si queda uno solo, se elige solo. `9e59514`
5. **Servicios frecuentes** (Fase 4 del plan) — El campo Servicio sugiere los nombres más usados. Sin precios. `9e59514`
6. **Aviso de superposición al agendar** — "Se pisa con Coco (09:00–10:00). Se puede guardar igual." `9e59514`
7. **Recordatorios en lote** (Fase 4) — La tarjeta del panel muestra el **próximo día con turnos** (un sábado
   muestra los del lunes, antes decía "Mañana no hay turnos"), un botón **"Avisar a Chocolate (1 de 5)"** que
   va abriendo WhatsApp de a uno y la marca **"✓ Enviado"** (se recuerda en ese dispositivo). `42fe717`
8. **Mensaje de recordatorio más natural** — "para *mañana lunes 28 de septiembre* a las 09:00", en lugar de
   "28 de septiembre 2026"; si el turno no tiene hora, ya no dice "a las hs". `42fe717` `53c0497`
9. **"Está listo" para retirar** — Si el turno está en curso ("Ahora" o "Atrasado"), el botón de WhatsApp de la
   tarjeta Próximo manda "¡Coco ya está listo! Cuando quieras podés pasar a buscarlo". `05e73da`
10. **Compartir la imagen de Horarios desde el celular** — Botón "Compartir" que abre el menú del teléfono
    (Instagram, WhatsApp) sin pasar por la galería. Si el navegador no lo permite, la descarga. `1389e04` `dff29b1`

### Información

11. **Clientes: filtros y orden** — Filtros rápidos con cantidad: *Les toca volver* (sin turno agendado,
    igual que el panel), *Con cuidados*, *Faltaron*, *Nuevos (1 visita)*, *Hace +4 meses*. Orden por nombre,
    más reciente, hace más que no viene o más visitas. La búsqueda también encuentra por raza y teléfono. `68454d1`
12. **Finanzas: proyección del mes** — "Quedan 16 turnos agendados este mes por $362.000. Si se cumplen, el mes
    cierra en $643.500." `392b8bf`
13. **Finanzas: comparación justa** — En el mes en curso comparaba lo cobrado hasta hoy contra el mes anterior
    **completo** (daba "−46%" a mitad de mes). Ahora compara "vs el 26 del mes pasado". `392b8bf`
14. **Finanzas: clientela** — Activos (vinieron en los últimos 3 meses), nuevos del mes, se pasaron de su
    frecuencia y sin venir hace más de 4 meses. `392b8bf`
15. **Finanzas: qué días rinden más** — Servicios e ingresos por día de la semana (últimos 3 meses). Sirve para
    decidir qué días abrir más horarios. `392b8bf`

### Diseño y técnico

16. **Arreglos visuales** — La tarjeta "Próximo" se rompía en tablet (el texto quedaba una palabra por línea) y
    en el celular "No vino" quedaba cortado. La agenda de hoy en el celular ya no se amontona. De madrugada
    saludaba "Buen día". `a4d3731` `6fd6554`
17. **App instalable + detalles** — Ícono propio (huella en menta) en vez del de Vite, título "Paupet",
    `lang="es"`, color de la barra del celular, y manifest para "Agregar a pantalla de inicio" (se abre como
    app, sin la barra del navegador). Carga con la **silueta de la pantalla** en lugar del círculo girando.
    `a4d3731` `6fd6554` `db118a4`
18. **Modo demo** (la base de todo lo anterior) — `npm run demo`: un Supabase falso en memoria, con los mismos
    datos y reglas (incluye la función de horarios libres de la migración 3). Sirve para probar cambios, mostrar
    la app o hacer capturas sin tocar datos reales. **No entra en el build de Vercel** (verificado). `4e05914`

---

## 💡 Propuestas para charlar (no implementadas)

Ordenadas por lo que creo que más aporta. Las marcadas 🗄️ necesitan un cambio en la base (compatible, como
las migraciones 2 y 3) o esperar a que la versión nueva reemplace a la anterior.

### Servicio
19. **Confirmación del turno por el cliente** — El recordatorio de WhatsApp lleva un link
    `/turnos/confirmar?…` con "Confirmo" / "No puedo ir". El turno pasa a Confirmado solo, o avisa que se
    liberó el horario. Debería bajar las faltas. 🗄️ (una función segura como `horarios_libres`)
20. **Lista de espera** — Cuando alguien pide un día lleno, queda anotado; si se cancela un turno, la app
    sugiere a quién avisarle. 🗄️ (tabla nueva)
21. **"No vino" como estado** en vez de borrar el turno — Queda la fecha de cada falta y se ve el historial.
    Ya estaba postergado en el plan por compatibilidad. 🗄️
22. **Seña para quien faltó 2+ veces** — Sólo como aviso al agendar ("pedir seña por transferencia").
    Lo decide Pau.
23. **Plantillas de WhatsApp editables** — Que Pau pueda cambiar el texto del recordatorio, "está listo" y
    "te toca volver" desde Configuración. 🗄️ (columna nueva en `config`, la versión anterior la ignora)
24. **Cumpleaños / edad del perro** — Campo opcional y saludo por WhatsApp el día del cumpleaños (fideliza
    mucho). 🗄️ (columna nueva)
25. **Mover turnos arrastrando** en la vista Semana, y nombres en lugar de puntitos en la vista Mes.

### Información
26. **Historial de precios en la ficha** — Mini gráfico de cuánto se le cobró a cada perro en el tiempo, y
    aviso suave "hace 6 meses que no se le actualiza el precio". Sólo informativo: el precio sigue a mano.
27. **Stock con cantidad mínima** (ya en la Fase 4) — "Shampoo: quedan 2, avisar con menos de 3".
28. **Resumen semanal automático** — Cada lunes, en el panel: turnos de la semana, a quién le toca volver y
    cómo cerró la semana anterior.

### Técnico
29. **Tests automáticos** de frecuencia, finanzas y horarios libres, antes de pasar la versión nueva a
    producción (el modo demo ya da los datos de prueba).
30. **Actualizar sin recargar todo** — Hoy cada acción vuelve a bajar todos los clientes, visitas y turnos.
    Con los años se va a notar: conviene actualizar sólo lo que cambió.
31. **Restaurar la copia de seguridad desde la app** (hoy es manual) y copia automática semanal.
32. **Deuda técnica:** los 6 avisos de lint `set-state-in-effect` (ya anotados en el plan) → abrir los modales
    con `key`.

### Diseño
33. **Modo oscuro** para usar de noche o con poca luz.
34. **Terminar de reemplazar los emojis** que quedan en botones (Horarios: 🗑 💾 📥, Configuración) por los
    íconos de línea del resto de la app.
35. **Horarios para Stories con el diseño nuevo en todo** — La página de edición de horarios todavía usa el
    estilo viejo (tarjetas chicas, degradados). Es la única pantalla que no se pasó a la maqueta.

---

## Cosas que encontré y conviene saber

- **Tu copia local de `main` estaba 4 commits atrás de GitHub** (faltaba el login seguro y la paginación). No
  la actualicé. Para ponerla al día: `git checkout main` y después `git pull`.
- En la rama nueva, `npm run lint` da **0 errores y 6 avisos** (los mismos de antes). El build anda bien.
- Para probar con los datos reales en la versión nueva hay que hacer `npm run dev` e iniciar sesión.
  **Eso escribe en la base de producción**, por eso probé todo en modo demo.
