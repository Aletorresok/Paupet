import { calcFrecuencia } from '../../lib/frecuencia';
import { diasDesde, todayStr } from '../../lib/utils';

const ultimaFecha = c => (c.visitas || []).reduce((m, v) => (v.fecha && v.fecha > m ? v.fecha : m), '');
const tieneCuidados = c => (c.etiquetas || []).some(e => /alerg|miedo|muerde|mord|nervio|agresiv|cuidado|no tolera|ansios/i.test(e))
  || /alerg|muerde|mord|agresiv|bozal/i.test(c.notes || '');

// Filtros rápidos de la lista de clientes. `test(c)` recibe el cliente con `_frec` precalculada.
export const FILTROS = [
  { id: 'todos',     label: 'Todos',            test: () => true },
  { id: 'volver',    label: 'Les toca volver',  test: c => c._frec && c._frec.estado !== 'al_dia' && !c._conTurno },
  { id: 'cuidados',  label: 'Con cuidados',     test: tieneCuidados },
  { id: 'faltaron',  label: 'Faltaron',         test: c => (c.inasistencias || 0) > 0 },
  { id: 'nuevos',    label: 'Nuevos (1 visita)', test: c => (c.visitas || []).length <= 1 },
  { id: 'perdidos',  label: 'Hace +4 meses',    test: c => { const u = ultimaFecha(c); return u && diasDesde(u) > 120; } },
];

export const ORDENES = [
  { id: 'nombre',  label: 'Nombre (A-Z)',          cmp: (a, b) => (a.dog || '').localeCompare(b.dog || '', 'es') },
  { id: 'reciente',label: 'Vino hace menos',       cmp: (a, b) => ultimaFecha(b).localeCompare(ultimaFecha(a)) },
  { id: 'antiguo', label: 'Hace más que no viene', cmp: (a, b) => (ultimaFecha(a) || '9').localeCompare(ultimaFecha(b) || '9') },
  { id: 'visitas', label: 'Más visitas',           cmp: (a, b) => (b.visitas || []).length - (a.visitas || []).length },
];

// Agrega la frecuencia y si ya tiene un turno próximo (igual que "Ya les toca volver" del panel).
export const conFrecuencia = (clientes, turnos = []) => {
  const hoy = todayStr();
  const conTurno = new Set(turnos.filter(t => t.fecha >= hoy && t.estado !== 'completed').map(t => t.clientId));
  return clientes.map(c => ({ ...c, _frec: calcFrecuencia(c.visitas), _conTurno: conTurno.has(c.id) }));
};

// Sin tildes ni mayúsculas, para buscar "simon" y encontrar "Simón".
export const normalizar = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
