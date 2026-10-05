import { aMinutos, aHora } from '../../lib/duracion';
import { parseFecha, toISODate } from '../../lib/utils';

// Nombres de servicio más usados (para autocompletar). Sin precios: se cobran a mano.
export function serviciosFrecuentes(clientes, max = 12) {
  const cuenta = new Map();
  for (const c of clientes) for (const v of c.visitas || []) {
    const s = (v.servicio || '').trim();
    if (s) cuenta.set(s, (cuenta.get(s) || 0) + 1);
  }
  return [...cuenta].sort((a, b) => b[1] - a[1]).slice(0, max).map(([s]) => s);
}

// Última visita del cliente (la más reciente por fecha) o null.
export const ultimaVisita = c =>
  [...(c?.visitas || [])].filter(v => v.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha))[0] || null;

// Turnos del mismo día que se pisan con [hora, hora+duracion). Ignora `excluirId` (el que se edita).
export function turnosQueSePisan(turnos, { fecha, hora, duracion, excluirId }) {
  if (!fecha || !/^\d{1,2}:\d{2}/.test(hora || '')) return [];
  const desde = aMinutos(hora), hasta = desde + (Number(duracion) || 60);
  return turnos.filter(t => t.id !== excluirId && t.fecha === fecha && t.estado !== 'completed' &&
    /^\d{1,2}:\d{2}/.test(t.hora || '') &&
    aMinutos(t.hora) < hasta && aMinutos(t.hora) + (t.duracion || 60) > desde);
}

export const rangoTurno = t => `${t.hora}–${aHora(aMinutos(t.hora) + (t.duracion || 60))}`;

// Fecha sugerida para el próximo turno: `desde` + `cadaDias`, nunca antes de mañana ni domingo.
export function fechaSugerida(desde, cadaDias) {
  const d = parseFecha(desde);
  d.setDate(d.getDate() + cadaDias);
  const manana = new Date(); manana.setHours(0, 0, 0, 0); manana.setDate(manana.getDate() + 1);
  if (d < manana) d.setTime(manana.getTime());
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return toISODate(d);
}

// Teclado de Cobrar: suma dígitos al monto (texto con sólo números, sin ceros adelante, hasta 7) o borra el último.
export const teclear = (monto, tecla) => tecla === '⌫' ? monto.slice(0, -1) : (monto + tecla).replace(/^0+/, '').slice(0, 7);

// Duración de un turno nuevo: la del último turno de ese perro con ese servicio; si no hay, la del último
// de cualquier perro con ese servicio; si no, 60 min.
export function duracionSugerida(turnos, clientId, servicio) {
  const s = (servicio || '').trim().toLowerCase();
  if (!s) return 60;
  const conServicio = turnos.filter(t => t.duracion && (t.servicio || '').trim().toLowerCase() === s)
    .sort((a, b) => `${b.fecha} ${b.hora || ''}`.localeCompare(`${a.fecha} ${a.hora || ''}`));
  const delPerro = clientId && conServicio.find(t => String(t.clientId) === String(clientId));
  return (delPerro || conServicio[0])?.duracion || 60;
}

// Horarios libres agrupados por día para Nuevo turno: [{ fecha, horas: ['09:00', …] }], sólo los que
// entran con esa duración sin pisar otro turno. `libres` = [{fecha, hora}] (de `horariosLibresPau`).
export function libresPorDia(libres, turnos, duracion) {
  const dias = new Map();
  for (const { fecha, hora } of libres) {
    if (turnosQueSePisan(turnos, { fecha, hora, duracion }).length) continue;
    if (!dias.has(fecha)) dias.set(fecha, []);
    dias.get(fecha).push(hora);
  }
  return [...dias].map(([fecha, horas]) => ({ fecha, horas }));
}

// "Hoy", "Mañana", "Jue 8".
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export function etiquetaDia(fecha, hoy = new Date()) {
  const d = parseFecha(fecha);
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dif = Math.round((d - h) / 86400000);
  return dif === 0 ? 'Hoy' : dif === 1 ? 'Mañana' : `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`;
}
