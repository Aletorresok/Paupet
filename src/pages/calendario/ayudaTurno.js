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
