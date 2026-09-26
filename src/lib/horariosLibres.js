// Misma regla que la función SQL `horarios_libres()` (supabase/migracion_05_pedidos.sql).
// La usa el modo demo y los tests; si se cambia una, hay que cambiar la otra.
//
// Sólo se ofrecen los horarios cargados en "Horarios para Stories" (próximos 21 días).
// Se descartan: días apagados, horarios tomados, los de menos de 1 hora desde `ahora`,
// los que se pisan con un turno (teniendo en cuenta ambas duraciones) y los que ya
// fueron pedidos (sin responder) o propuestos por Pau.

const pad = n => String(n).padStart(2, '0');
const aKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const aMin = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
const DIA = 86400000;

export function calcularHorariosLibres(config, turnos, ahora = new Date(), pedidos = []) {
  const h = config?.horarios_semanales || {};
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const limite = aKey(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 21));
  const reciente = (p, dias) => !p.created_at || ahora - new Date(p.created_at) < dias * DIA;
  const pedidosTomados = new Set([
    ...pedidos.filter(p => p.estado === 'nuevo' && p.fecha && reciente(p, 7)).map(p => p.fecha + p.hora),
    ...pedidos.filter(p => p.estado === 'propuesto' && p.fecha_prop && reciente(p, 14)).map(p => p.fecha_prop + p.hora_prop),
  ]);

  const filas = [];
  for (const [fecha, horas] of Object.entries(h.slots || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Array.isArray(horas)) continue;
    if (fecha < aKey(hoy) || fecha > limite) continue;
    if ((h.diasActivos || []).includes('NO:' + fecha)) continue;
    const [y, m, dd] = fecha.split('-').map(Number);
    for (const hora of new Set(horas)) {
      if (typeof hora !== 'string' || !HORA.test(hora)) continue;
      if (new Date(y, m - 1, dd, ...hora.split(':').map(Number)) - ahora <= 3600000) continue;
      if ((h.tomados?.[fecha] || []).includes(hora)) continue;
      if (pedidosTomados.has(fecha + hora)) continue;
      const desde = aMin(hora), hasta = desde + 60;
      const pisa = turnos.some(t => t.fecha === fecha && /^\d{1,2}:\d{2}/.test(t.hora || '') &&
        desde < aMin(t.hora) + (t.duracion || 60) && aMin(t.hora) < hasta);
      if (!pisa) filas.push({ fecha, hora });
    }
  }
  return filas.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
}
