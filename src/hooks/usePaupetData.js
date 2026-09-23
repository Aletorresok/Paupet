import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';
import { DEFAULT_CONFIG } from '../lib/constants';

// Estado global de datos cargados desde Supabase.
export function usePaupetData(toast) {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [turnos, setTurnos]   = useState([]);
  const [notas, setNotas]     = useState([]);
  const [config, setConfig]   = useState(DEFAULT_CONFIG);
  const [caps, setCaps]       = useState({ duracion: false, etiquetas: false, fotos: false });

  const loadAll = useCallback(async () => {
    try {
      const [c, t, n, cfg, cap] = await Promise.all([db.getClientes(), db.getTurnos(), db.getNotas(), db.getConfig(), db.detectarCapacidades()]);
      // Los turnos de un cliente repetido se asocian al cliente que se muestra.
      const canonicoDe = new Map(c.flatMap(cl => cl.aliasIds.map(id => [id, cl.id])));
      const turnosMapeados = t.map(x => canonicoDe.has(x.clientId) ? {...x, clientId: canonicoDe.get(x.clientId)} : x);
      setClientes(c); setTurnos(turnosMapeados); setNotas(n); setConfig(cfg); setCaps(cap);
    } catch(e) {
      toast('Error cargando datos: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return { loading, clientes, turnos, notas, setNotas, config, setConfig, loadAll, caps };
}
