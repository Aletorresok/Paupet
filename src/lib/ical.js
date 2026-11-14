// Lee el calendario de Google en formato iCal (la "dirección secreta") y se queda sólo con los turnos.
// Lo usan la función de Vercel `api/calendar.js`, el modo demo y los tests: sin imports del navegador.
//
// Regla para saber qué es un turno: el título tiene el emoji 🐶 o la palabra "turno".
// Todo lo demás (facultad, personal) se descarta acá mismo y nunca llega a Paupet.

const ZONA = 'America/Argentina/Buenos_Aires';
export const DIAS_ADELANTE = 120;
// Sólo direcciones secretas de Google Calendar: la función de Vercel no lee ninguna otra página.
export const URL_CALENDAR = /^https:\/\/calendar\.google\.com\/calendar\/ical\/[^\s?#]+\/basic\.ics$/;

const pad = n => String(n).padStart(2, '0');
const sinAcentos = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const esTurno = titulo => /🐶/u.test(titulo || '') || /(^|[^a-z0-9])turnos?([^a-z0-9]|$)/.test(sinAcentos(titulo));

// Fecha y hora de Buenos Aires de un instante.
const fmtZona = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function enZona(instante) {
  const p = Object.fromEntries(fmtZona.formatToParts(instante).map(x => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

// "20261116T130000Z" (UTC), "20261116T100000" (hora local del calendario) o "20261116" (todo el día).
// Devuelve { fecha, hora, min } con `min` = minutos desde una época común, para calcular la duración.
function leerFecha(valor) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec((valor || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (h == null) return { fecha: `${y}-${mo}-${d}`, hora: '', min: Date.UTC(y, mo - 1, d) / 60000 };
  const utc = Date.UTC(y, mo - 1, d, h, mi);
  if (z) return { ...enZona(new Date(utc)), min: utc / 60000 };
  return { fecha: `${y}-${mo}-${d}`, hora: `${h}:${mi}`, min: utc / 60000 };
}

const limpiarTexto = s => (s || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

// Todos los eventos del archivo: [{ uid, titulo, fecha, hora, duracion, cancelado, repetido }].
export function leerEventos(texto) {
  // Las líneas largas vienen cortadas: la continuación empieza con un espacio o tab.
  const lineas = (texto || '').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const eventos = [];
  let ev = null;
  for (const linea of lineas) {
    if (linea === 'BEGIN:VEVENT') { ev = {}; continue; }
    if (linea === 'END:VEVENT') { if (ev) eventos.push(ev); ev = null; continue; }
    if (!ev) continue;
    const i = linea.indexOf(':');
    if (i < 0) continue;
    const nombre = linea.slice(0, i).split(';')[0].toUpperCase();
    // Si una propiedad se repite (no debería), vale la primera.
    if (!(nombre in ev)) ev[nombre] = linea.slice(i + 1);
  }
  return eventos.map(e => {
    const ini = leerFecha(e.DTSTART), fin = leerFecha(e.DTEND);
    if (!e.UID || !ini) return null;
    const minutos = fin ? Math.round(fin.min - ini.min) : 60;
    return {
      uid: e.UID.trim(), titulo: limpiarTexto(e.SUMMARY), fecha: ini.fecha, hora: ini.hora,
      duracion: ini.hora ? Math.min(480, Math.max(15, minutos || 60)) : 60,
      cancelado: (e.STATUS || '').trim().toUpperCase() === 'CANCELLED',
      repetido: 'RRULE' in e || 'RECURRENCE-ID' in e,
    };
  }).filter(Boolean);
}

const sumarDias = (fecha, dias) => {
  const [y, m, d] = fecha.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + dias));
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
};

// Los turnos del calendario desde hoy hasta dentro de DIAS_ADELANTE días.
// Devuelve { eventos, desde, hasta, repetidos } (`repetidos`: turnos que se repiten, que todavía no se importan).
export function turnosDelCalendario(texto, ahora = new Date()) {
  if (!/BEGIN:VCALENDAR/.test(texto || '')) throw new Error('Eso no parece un calendario de Google');
  const desde = enZona(ahora).fecha, hasta = sumarDias(desde, DIAS_ADELANTE);
  const turnos = leerEventos(texto).filter(e => !e.cancelado && esTurno(e.titulo));
  return {
    eventos: turnos.filter(e => !e.repetido && e.fecha >= desde && e.fecha <= hasta)
      .map(({ uid, titulo, fecha, hora, duracion }) => ({ uid, titulo, fecha, hora, duracion })),
    // Un evento que se repite trae la fecha de la primera vez: se cuentan todos, sin mirar la fecha.
    desde, hasta, repetidos: new Set(turnos.filter(e => e.repetido).map(e => e.uid)).size,
  };
}
