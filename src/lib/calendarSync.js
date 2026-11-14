// Turnos que vienen de Google Calendar (migración 9): qué perro y servicio dice el título, y qué hay que
// crear, mover o sacar en Paupet para quedar igual que el calendario. Sin acceso a la base: sólo cuentas.

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabras = s => norm(s).replace(/[^a-z0-9ñ]+/g, ' ').trim();
// "coco" está en "bano coco y corte" como palabra entera (no en "cocodrilo").
const contiene = (frase, parte) => !!parte && ` ${frase} `.includes(` ${parte} `);

// El título sin la marca: "🐶 Turno: Coco baño" → "Coco baño".
export const limpiarTitulo = titulo => (titulo || '').replace(/🐶/gu, ' ').replace(/(^|[^\p{L}\p{N}])turnos?(?=[^\p{L}\p{N}]|$)/giu, '$1')
  .replace(/\s+/g, ' ').replace(/^[\s\-–:·,.|]+|[\s\-–:·,.|]+$/g, '');

// Un turno importado al que le falta el perro o el servicio.
export const porCompletar = t => !!t?.gcalUid && t.estado !== 'completed' && (!t.clientId || !(t.servicio || '').trim());

// Lo que cambia en Calendar y Paupet copia: día, hora y duración.
export const firma = e => `${e.fecha} ${e.hora || ''} ${e.duracion || 60}`;

// Qué perro y qué servicio dice el título. `servicios` = nombres conocidos (los más usados).
// Devuelve { clientId, servicio, nombre }: clientId null si no se reconoce un solo perro; `nombre` es lo que se
// muestra mientras tanto.
export function reconocer(titulo, clientes, servicios = []) {
  const limpio = limpiarTitulo(titulo);
  const frase = palabras(limpio);
  let candidatos = clientes.filter(c => contiene(frase, palabras(c.dog)));
  // "Mía Luna" le gana a "Mía"; con dos perros del mismo nombre, desempata el nombre del dueño.
  const largo = Math.max(0, ...candidatos.map(c => palabras(c.dog).length));
  candidatos = candidatos.filter(c => palabras(c.dog).length === largo);
  if (candidatos.length > 1) {
    const porDuenio = candidatos.filter(c => palabras(c.owner).split(' ').some(p => p.length > 2 && contiene(frase, p)));
    if (porDuenio.length === 1) candidatos = porDuenio;
  }
  const cliente = candidatos.length === 1 ? candidatos[0] : null;

  const conocido = [...servicios].sort((a, b) => b.length - a.length).find(s => contiene(frase, palabras(s)));
  let servicio = conocido || '';
  if (!servicio && cliente) {
    // Lo que queda del título después de sacar el nombre del perro: "Coco deslanado" → "Deslanado".
    const resto = limpio.split(/\s+/).filter(p => !palabras(cliente.dog).split(' ').includes(palabras(p))).join(' ').replace(/^[\s\-–:·,.|]+|[\s\-–:·,.|]+$/g, '');
    servicio = resto ? resto[0].toUpperCase() + resto.slice(1) : '';
  }
  // Sin perro reconocido se muestra el título sin el servicio: "Rex baño y corte" → "Rex".
  const delServicio = palabras(conocido).split(' ');
  const sinServicio = conocido ? limpio.split(/\s+/).filter(p => !delServicio.includes(palabras(p))).join(' ') : limpio;
  return { clientId: cliente?.id ?? null, servicio, nombre: cliente?.dog || sinServicio || limpio || 'Turno de Calendar' };
}

// Compara el calendario con los turnos de Paupet.
//   crear:  eventos que todavía no son turnos (ya con perro y servicio reconocidos)
//   mover:  turnos cuyo evento cambió de día, hora o duración en Calendar
//   faltan: turnos cuyo evento ya no está en Calendar (se borró o perdió la marca)
//   ignorados: los eventos que Pau borró de Paupet y siguen en Calendar (para no volver a traerlos)
export function planSync({ eventos, desde, hasta }, turnos, clientes, servicios, ignorados = []) {
  const porUid = new Map(turnos.filter(t => t.gcalUid).map(t => [t.gcalUid, t]));
  const enCalendar = new Set(eventos.map(e => e.uid));
  const crear = [], mover = [];
  for (const e of eventos) {
    if (ignorados.includes(e.uid)) continue;
    const t = porUid.get(e.uid);
    if (!t) { crear.push({ ...e, ...reconocer(e.titulo, clientes, servicios) }); continue; }
    // Sólo si cambió en Calendar desde la última vez: lo que Pau movió en Paupet no se pisa.
    if (t.estado !== 'completed' && t.gcalInicio && t.gcalInicio !== firma(e)) mover.push({ id: t.id, fecha: e.fecha, hora: e.hora, duracion: e.duracion, gcalInicio: firma(e) });
  }
  const faltan = turnos.filter(t => t.gcalUid && t.estado !== 'completed' && !enCalendar.has(t.gcalUid) && t.fecha >= desde && t.fecha <= hasta);
  return { crear, mover, faltan, ignorados: ignorados.filter(uid => enCalendar.has(uid)) };
}
