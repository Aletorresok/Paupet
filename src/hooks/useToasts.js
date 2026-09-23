import { useState, useCallback } from 'react';

// Vibración cortita al confirmar algo (o doble si es un error): con el ruido del secador,
// a veces no alcanza con ver el aviso. En celulares sin vibración no hace nada.
const vibrar = error => { try { navigator.vibrate?.(error ? [30, 60, 30] : 40); } catch { /* sin vibración */ } };

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, error=false) => {
    const id = Date.now();
    setToasts(ts => [...ts,{id,msg,error}]);
    vibrar(error);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)), 3500);
  }, []);
  return { toasts, toast };
}
