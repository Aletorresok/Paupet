import { fmtPeso } from '../../lib/utils';

// Estadísticas del mes/año calculadas sólo sobre VISITAS (evita duplicar turnos completados).
export function calcDashboardStats(clientes, turnos, hoy) {
  const anioActual = String(hoy.getFullYear());
  const mesActualStr = `${anioActual}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const visitas = clientes.flatMap(c => c.visitas || []);

  const visitasDelMes = visitas.filter(v => v.fecha && v.fecha.startsWith(mesActualStr));
  let totalEfectivo = 0;
  let totalTransferencia = 0;
  visitasDelMes.forEach(v => {
    if (v.forma_pago === 'transferencia') totalTransferencia += (v.precio || 0);
    else totalEfectivo += (v.precio || 0);
  });

  const serviciosAnio = visitas.filter(v => v.fecha && v.fecha.startsWith(anioActual)).length;
  const pending = turnos.filter(t => t.estado === 'pending');

  return [
    {label:'Servicios Mes', val:visitasDelMes.length, sub:'este mes', emoji:'🐶'},
    {label:'Servicios Año', val:serviciosAnio, sub:`año ${anioActual}`, emoji:'📅'},
    {label:'Ingresos Mes', val:fmtPeso(totalEfectivo + totalTransferencia), sub:`💵 ${fmtPeso(totalEfectivo)} | 📱 ${fmtPeso(totalTransferencia)}`, emoji:'💚'},
    {label:'Pendientes', val:pending.length, sub:'sin confirmar', emoji:'⏳'},
  ];
}
