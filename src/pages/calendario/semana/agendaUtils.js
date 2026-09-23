import { aMinutos } from '../../../lib/duracion';
import { toISODate } from '../../../lib/utils';

// Lunes de la semana de `fecha` (a medianoche local).
export function inicioSemana(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Días de la semana a mostrar: lunes a sábado, y el domingo sólo si tiene turnos.
export function diasSemana(lunes, turnos) {
  const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(d.getDate() + i); return d; });
  const domingo = toISODate(dias[6]);
  return turnos.some(t => t.fecha === domingo) ? dias : dias.slice(0, 6);
}

const inicio = t => aMinutos(t.hora);
const fin = t => inicio(t) + (t.duracion || 60);

// Ubica los turnos de un día en columnas cuando se superponen.
// Devuelve [{turno, col, cols, solapado}] y la lista de pares superpuestos.
export function layoutDia(turnos) {
  const orden = turnos.filter(t => t.hora).sort((a, b) => inicio(a) - inicio(b) || fin(b) - fin(a));
  const res = [];
  const solapes = [];
  let grupo = [], finGrupo = -1;
  const cerrarGrupo = () => {
    const columnas = [];
    grupo.forEach(item => {
      let c = columnas.findIndex(finCol => finCol <= inicio(item.turno));
      if (c === -1) { c = columnas.length; columnas.push(0); }
      columnas[c] = fin(item.turno);
      item.col = c;
    });
    grupo.forEach(item => { item.cols = columnas.length; item.solapado = columnas.length > 1; });
    res.push(...grupo);
    grupo = []; finGrupo = -1;
  };
  orden.forEach(t => {
    if (grupo.length && inicio(t) >= finGrupo) cerrarGrupo();
    grupo.forEach(g => { if (inicio(t) < fin(g.turno)) solapes.push([g.turno, t]); });
    grupo.push({ turno: t });
    finGrupo = Math.max(finGrupo, fin(t));
  });
  if (grupo.length) cerrarGrupo();
  return { items: res, solapes };
}

// Rango de horas a mostrar (en minutos), con al menos 9 a 19 hs.
export function rangoHoras(turnos) {
  let desde = 9 * 60, hasta = 19 * 60;
  turnos.forEach(t => { if (!t.hora) return; desde = Math.min(desde, inicio(t)); hasta = Math.max(hasta, fin(t)); });
  return { desde: Math.floor(desde / 60) * 60, hasta: Math.ceil(hasta / 60) * 60 };
}
