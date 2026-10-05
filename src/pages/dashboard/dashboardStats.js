import { aMinutos } from '../../lib/duracion';

// Resumen del mes actual. Los ingresos salen de las VISITAS (cada turno completado crea una),
// los gastos de las notas de tipo "egreso".
// `mes`: Date (se usa su mes) o "YYYY-MM".
export function calcResumenMes(clientes, notas, mesODate) {
  const mes = typeof mesODate === 'string' ? mesODate
    : `${mesODate.getFullYear()}-${String(mesODate.getMonth() + 1).padStart(2, '0')}`;
  const visitas = clientes.flatMap(c => c.visitas || []).filter(v => v.fecha && v.fecha.startsWith(mes));
  let efectivo = 0, transferencia = 0;
  visitas.forEach(v => {
    if (v.forma_pago === 'transferencia') transferencia += (v.precio || 0);
    else efectivo += (v.precio || 0);
  });
  const ingresos = efectivo + transferencia;
  const egresos = notas
    .filter(n => n.tipo === 'egreso' && n.fecha && n.fecha.startsWith(mes))
    .reduce((s, n) => s + (n.monto || 0), 0);
  return {
    ingresos, efectivo, transferencia, egresos,
    ganancia: ingresos - egresos,
    servicios: visitas.length,
    ticket: visitas.length ? Math.round(ingresos / visitas.length) : 0,
  };
}

// El turno de ahora. Pau no marca cuándo empieza: es el último que ya empezó y todavía no se cobró
// (cobrar es lo que lo cierra). Si ninguno empezó, el próximo. Devuelve { turno, estado, faltan } o null:
// estado 'enCurso' (dentro de su horario), 'terminado' (ya pasó su horario y falta cobrar) o 'proximo'
// (`faltan` = minutos hasta que empiece; null si no tiene hora).
export function turnoActual(turnosHoy, ahora = new Date()) {
  const sinCobrar = turnosHoy.filter(t => t.estado !== 'completed');
  const conHora = sinCobrar.filter(t => t.hora).sort((a, b) => aMinutos(a.hora) - aMinutos(b.hora));
  const now = ahora.getHours() * 60 + ahora.getMinutes();
  const empezados = conHora.filter(t => aMinutos(t.hora) <= now);
  if (empezados.length) {
    const turno = empezados[empezados.length - 1];
    const fin = aMinutos(turno.hora) + (turno.duracion || 60);
    return { turno, estado: now < fin ? 'enCurso' : 'terminado', faltan: 0 };
  }
  if (conHora.length) return { turno: conHora[0], estado: 'proximo', faltan: aMinutos(conHora[0].hora) - now };
  return sinCobrar.length ? { turno: sinCobrar[0], estado: 'proximo', faltan: null } : null;
}

// Turnos que ya empezaron, no son el de ahora y quedaron sin cobrar.
export const sinCobrarAntes = (turnosHoy, actual, ahora = new Date()) => {
  const now = ahora.getHours() * 60 + ahora.getMinutes();
  return turnosHoy.filter(t => t.estado !== 'completed' && t.hora && t.id !== actual?.turno.id && aMinutos(t.hora) <= now);
};
