// Cuánto se le cobró a este perro a lo largo del tiempo, para el servicio que más se hace.
// Sólo informativo: el precio se sigue poniendo a mano en cada turno.
export function resumenPrecios(visitas) {
  const cuenta = new Map();
  (visitas || []).forEach(v => { const s = (v.servicio || '').trim(); if (s && v.precio > 0) cuenta.set(s, (cuenta.get(s) || 0) + 1); });
  const [servicio] = [...cuenta].sort((a, b) => b[1] - a[1])[0] || [];
  if (!servicio) return null;
  const serie = (visitas || []).filter(v => (v.servicio || '').trim() === servicio && v.precio > 0 && v.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-12);
  if (serie.length < 2) return null;
  let ultimoAumento = null;
  for (let i = serie.length - 1; i > 0; i--) if (serie[i].precio > serie[i - 1].precio) { ultimoAumento = serie[i]; break; }
  const primero = serie[0], ultimo = serie[serie.length - 1];
  return { servicio, serie, primero, ultimo, ultimoAumento, variacion: Math.round((ultimo.precio - primero.precio) / primero.precio * 100) };
}
