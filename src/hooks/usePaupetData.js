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

  const loadAll = useCallback(async () => {
    try {
      const [c, t, n, cfg] = await Promise.all([db.getClientes(), db.getTurnos(), db.getNotas(), db.getConfig()]);
      setClientes(c); setTurnos(t); setNotas(n); setConfig(cfg);
    } catch(e) {
      toast('Error cargando datos: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return { loading, clientes, turnos, notas, setNotas, config, setConfig, loadAll };
}
