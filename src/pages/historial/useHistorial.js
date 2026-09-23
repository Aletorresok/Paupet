import { useMemo } from 'react';

// Une visitas y turnos completados en una sola lista ordenada por fecha desc.
// Al completar un turno se crea su visita, así que un turno completado sólo se muestra
// si no tiene una visita equivalente (turnos viejos). Las visitas nunca se descartan:
// dos servicios iguales el mismo día son dos registros reales.
export function useHistorial(clientes, turnos) {
  return useMemo(() => {
    const clave = (clienteId, fecha, servicio) => `${clienteId}|${fecha}|${(servicio || '').trim().toLowerCase()}`;
    const conVisita = new Set();
    const allVisits = clientes.flatMap(c =>
      (c.visitas||[]).map(v => {
        conVisita.add(clave(c.id, v.fecha, v.servicio));
        return {...v, dog:c.dog, owner:c.owner, source:'visita'};
      })
    );
    const completedT = turnos
      .filter(t => t.estado==='completed' && !conVisita.has(clave(t.clientId, t.fecha, t.servicio)))
      .map(t => {
        const c = clientes.find(x=>x.id===t.clientId)||{};
        return {id:'t'+t.id, fecha:t.fecha, servicio:t.servicio, precio:t.precio||0, forma_pago:t.forma_pago||'efectivo', dog:t.dogName||c.dog||'', owner:c.owner||'', source:'turno'};
      });
    const merged = [...completedT, ...allVisits]
      .sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));
    const months = [...new Set(merged.map(v => v.fecha ? v.fecha.slice(0,7) : ''))].filter(Boolean);
    return { all: merged, months };
  }, [clientes, turnos]);
}
