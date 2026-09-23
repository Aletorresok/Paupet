// Resumen del mes actual. Los ingresos salen de las VISITAS (cada turno completado crea una),
// los gastos de las notas de tipo "egreso".
export function calcResumenMes(clientes, notas, hoy) {
  const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
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

const minutos = hhmm => { const [h, m] = (hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };

// Próximo turno de hoy sin completar (o el primero atrasado). Devuelve {turno, etiqueta} o null.
export function proximoTurno(turnosHoy, ahora = new Date()) {
  const pendientes = turnosHoy.filter(t => t.estado !== 'completed').sort((a, b) => minutos(a.hora) - minutos(b.hora));
  if (!pendientes.length) return null;
  const now = ahora.getHours() * 60 + ahora.getMinutes();
  const futuro = pendientes.find(t => minutos(t.hora) >= now - 15);
  const turno = futuro || pendientes[0];
  const diff = minutos(turno.hora) - now;
  const etiqueta = diff > 60 ? `Próximo · a las ${turno.hora}` : diff > 0 ? `Próximo · en ${diff} min` : diff >= -15 ? 'Ahora' : 'Atrasado';
  return { turno, etiqueta };
}
