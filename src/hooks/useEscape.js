import { useEffect, useRef } from 'react';

// Ventanas abiertas, de la de más abajo a la de más arriba: Escape cierra sólo la de arriba.
const pila = [];

export function useEscape(open, onClose) {
  const cerrar = useRef(onClose);
  useEffect(() => { cerrar.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const id = {};
    pila.push(id);
    const onKey = e => { if (e.key === 'Escape' && pila[pila.length - 1] === id) cerrar.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); pila.splice(pila.indexOf(id), 1); };
  }, [open]);
}
