import { calcFrecuencia } from '../../lib/frecuencia';
import { diasDesde } from '../../lib/utils';

// Foto de la clientela: activos (vinieron en los últimos 90 días), nuevos del mes
// (su primera visita fue en `mes`), a los que ya les toca volver y "perdidos" (+4 meses sin venir).
export function estadoClientes(clientes, mes) {
  let activos = 0, nuevos = 0, vencidos = 0, perdidos = 0;
  for (const c of clientes) {
    const fechas = (c.visitas || []).map(v => v.fecha).filter(Boolean).sort();
    if (!fechas.length) continue;
    const ultima = diasDesde(fechas[fechas.length - 1]);
    if (ultima <= 90) activos++;
    if (ultima > 120) perdidos++;
    if (fechas[0].startsWith(mes)) nuevos++;
    const f = calcFrecuencia(c.visitas);
    if (f && f.estado === 'vencido' && ultima <= 120) vencidos++;
  }
  return { activos, nuevos, vencidos, perdidos, total: clientes.length };
}
