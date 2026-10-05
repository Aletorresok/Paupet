import { useEffect, useState } from 'react';
import { avisados, EVENTO } from '../lib/avisados';

// Recordatorios ya enviados en este dispositivo, actualizados cuando se marca uno en cualquier pantalla.
export function useAvisados() {
  const [enviados, setEnviados] = useState(avisados);
  useEffect(() => {
    const actualizar = () => setEnviados(avisados());
    window.addEventListener(EVENTO, actualizar);
    return () => window.removeEventListener(EVENTO, actualizar);
  }, []);
  return enviados;
}
