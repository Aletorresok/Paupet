import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// [{fecha,hora}, …] → [{fecha, horas:[…]}, …] en orden.
export function agruparPorDia(filas) {
  const dias = new Map();
  for (const { fecha, hora } of filas) {
    if (!dias.has(fecha)) dias.set(fecha, []);
    dias.get(fecha).push(hora);
  }
  return [...dias].map(([fecha, horas]) => ({ fecha, horas: horas.sort() }));
}

// Horarios libres publicados por Pau (función `horarios_libres` de la migración 3).
// Si la función no existe todavía o falla, devuelve una lista vacía y la página
// pasa sola al modo "escribí cuándo podés".
export function useHorariosLibres() {
  const [estado, setEstado] = useState({ cargando: true, dias: [] });
  useEffect(() => {
    let vivo = true;
    supabase.rpc('horarios_libres').then(({ data, error }) => {
      if (!vivo) return;
      setEstado({ cargando: false, dias: error || !Array.isArray(data) ? [] : agruparPorDia(data) });
    });
    return () => { vivo = false; };
  }, []);
  return estado;
}
