import { calcFrecuencia } from '../../lib/frecuencia';
import { diasDesde } from '../../lib/utils';
import { C } from '../../lib/styles';

export const GRUPOS_CLIENTELA = [
  { id: 'activos', label: 'Activos', det: 'vinieron en los últimos 3 meses', color: C.verde },
  { id: 'nuevos', label: 'Nuevos', det: 'primera visita este mes', color: C.verde },
  { id: 'vencidos', label: 'Se pasaron', det: 'ya les tocaba volver', color: C.ambar },
  { id: 'perdidos', label: 'Sin venir', det: 'hace más de 4 meses', color: C.rosa },
];

// Foto de la clientela: activos (vinieron en los últimos 90 días), nuevos del mes
// (su primera visita fue en `mes`), a los que ya les toca volver y "perdidos" (+4 meses sin venir).
// Cada grupo es la lista de perros (con su última visita), para poder ver quiénes son.
export function estadoClientes(clientes, mes) {
  const activos = [], nuevos = [], vencidos = [], perdidos = [];
  for (const c of clientes) {
    const fechas = (c.visitas || []).map(v => v.fecha).filter(Boolean).sort();
    if (!fechas.length) continue;
    const item = { id: c.id, dog: c.dog, owner: c.owner, ultima: fechas[fechas.length - 1] };
    const ultima = diasDesde(item.ultima);
    if (ultima <= 90) activos.push(item);
    if (ultima > 120) perdidos.push(item);
    if (fechas[0].startsWith(mes)) nuevos.push(item);
    const f = calcFrecuencia(c.visitas);
    if (f && f.estado === 'vencido' && ultima <= 120) vencidos.push(item);
  }
  const masViejoPrimero = (a, b) => a.ultima.localeCompare(b.ultima);
  return { activos, nuevos, vencidos: vencidos.sort(masViejoPrimero), perdidos: perdidos.sort(masViejoPrimero), total: clientes.length };
}
