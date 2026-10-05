// Lo que va en la bandeja de Avisos: a quién hay que mandarle un mensaje.
import { DIAS_ES } from './constants';
import { toISODate } from './utils';

// Próximo día con turnos para recordar: mañana, o hasta 3 días después (p. ej. el lunes si hoy es sábado).
// Devuelve { fecha, titulo, turnos } con `titulo` = "mañana" o el nombre del día ("lunes").
export function proximoDiaConTurnos(turnos, hoy = new Date()) {
  let dia = new Date(hoy), fecha = '';
  for (let i = 1; i <= 3; i++) {
    dia = new Date(hoy); dia.setDate(dia.getDate() + i);
    fecha = toISODate(dia);
    if (i === 1 && dia.getDay() !== 0 && turnos.some(t => t.fecha === fecha)) break;
    if (turnos.some(t => t.fecha === fecha && t.estado !== 'completed')) break;
  }
  const diasHasta = Math.round((dia - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000);
  return {
    fecha,
    titulo: diasHasta === 1 ? 'mañana' : DIAS_ES[dia.getDay()].toLowerCase(),
    turnos: turnos.filter(t => t.fecha === fecha && t.estado !== 'completed'),
  };
}

// Recordatorios que faltan mandar: turnos del próximo día, con teléfono, no marcados como enviados.
export function recordatoriosSinEnviar(turnosDelDia, clientes, enviados) {
  return turnosDelDia.filter(t => !enviados[t.id] && clientes.find(c => c.id === t.clientId)?.tel);
}
