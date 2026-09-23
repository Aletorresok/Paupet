import { useMemo } from 'react';

// Une visitas y turnos completados en una sola lista ordenada por fecha desc.
export function useHistorial(clientes, turnos) {
  return useMemo(() => {
    const allVisits = clientes.flatMap(c =>
      (c.visitas||[]).map(v => ({...v, dog:c.dog, owner:c.owner, source:'visita'}))
    );
    const completedT = turnos
      .filter(t => t.estado==='completed')
      .map(t => {
        const c = clientes.find(x=>x.id===t.clientId)||{};
        return {id:t.id, fecha:t.fecha, servicio:t.servicio, precio:t.precio||0, forma_pago:t.forma_pago||'efectivo', dog:t.dogName||c.dog||'', owner:c.owner||'', source:'turno'};
      });
    const seen = new Set();
    const merged = [...completedT, ...allVisits]
      .filter(v => {
        const k = `${v.dog}|${v.fecha}|${v.servicio}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
    const months = [...new Set(merged.map(v => v.fecha ? v.fecha.slice(0,7) : ''))].filter(Boolean);
    return { all: merged, months };
  }, [clientes, turnos]);
}
