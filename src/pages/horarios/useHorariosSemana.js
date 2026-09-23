import { useState, useEffect } from 'react';
import { DIAS_SEMANA_HOD } from '../../lib/constants';
import { getSlotsDelDia } from '../../lib/utils';
import { toKey, proximoLunes, getDiaDate as diaDateDe } from './horariosUtils';

// Estado editable de la semana a publicar: slots por fecha, días apagados y horarios tomados.
export function useHorariosSemana(horariosData) {
  const [semanaInicio, setSemanaInicio] = useState(() => {
    if (horariosData?.semanaInicio) return new Date(horariosData.semanaInicio);
    return proximoLunes();
  });
  const [slots, setSlots] = useState(horariosData?.slots || {});
  const [diasActivos, setDiasActivos] = useState(horariosData?.diasActivos || []);
  const [tomados, setTomados] = useState(horariosData?.tomados || {});

  useEffect(() => {
    if (!horariosData) return;
    if (horariosData.semanaInicio) setSemanaInicio(new Date(horariosData.semanaInicio));
    if (horariosData.slots)        setSlots(horariosData.slots);
    if (horariosData.diasActivos) setDiasActivos(horariosData.diasActivos);
    if (horariosData.tomados)     setTomados(horariosData.tomados);
  }, [horariosData]);

  const getDiaDate = dia => diaDateDe(semanaInicio, dia);
  const keyDe = dia => toKey(getDiaDate(dia));

  const isDiaActivo = (dia) => !diasActivos.includes('NO:' + keyDe(dia));

  const toggleDia = (dia) => {
    const k = 'NO:' + keyDe(dia);
    setDiasActivos(ds => ds.includes(k) ? ds.filter(d => d !== k) : [...ds, k]);
  };

  const agregarSlots = (dia, horas) => {
    const k = keyDe(dia);
    setSlots(s => ({...s, [k]: [...new Set([...getSlotsDelDia(s, k), ...horas])].sort()}));
  };

  const quitarSlot = (dia, hora) => {
    const k = keyDe(dia);
    setSlots(s => ({...s, [k]: getSlotsDelDia(s, k).filter(h=>h!==hora)}));
    setTomados(t => ({...t, [k]: (t[k]||[]).filter(h=>h!==hora)}));
  };

  const toggleTomado = (dia, hora) => {
    const k = keyDe(dia);
    setTomados(t => {
      const lista = t[k]||[];
      return {...t, [k]: lista.includes(hora) ? lista.filter(h=>h!==hora) : [...lista, hora]};
    });
  };

  const cambiarSemana = (dir) => setSemanaInicio(s => { const d = new Date(s); d.setDate(d.getDate() + dir*7); return d; });

  const limpiarSemana = () => {
    const keysSemana = DIAS_SEMANA_HOD.map(keyDe);
    setSlots(s => { const n={...s}; keysSemana.forEach(k=>delete n[k]); return n; });
    setTomados(t => { const n={...t}; keysSemana.forEach(k=>delete n[k]); return n; });
    setDiasActivos(ds => ds.filter(d => !keysSemana.some(k => d === 'NO:'+k)));
  };

  // Datos de cada día listos para renderizar.
  const dias = DIAS_SEMANA_HOD.map(dia => {
    const date = getDiaDate(dia);
    const k = toKey(date);
    return { dia, date, horas: getSlotsDelDia(slots, k), tomados: tomados[k] || [], activo: isDiaActivo(dia) };
  });

  return {
    semanaInicio, dias,
    toggleDia, agregarSlots, quitarSlot, toggleTomado, cambiarSemana, limpiarSemana,
    snapshot: () => ({ semanaInicio: semanaInicio.toISOString(), slots, diasActivos, tomados }),
  };
}
