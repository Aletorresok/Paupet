// Cálculos para que los días de la imagen de Stories aprovechen el espacio (como el diseño Clásico):
// cada día recibe una parte igual del alto libre y la letra de los horarios se ajusta a su recuadro.

// Alto de cada recuadro: reparte `disponible` entre `n` días, con un tope para que 1-2 días no queden enormes.
export const altoPorDia = (disponible, n, gap, max = 260) =>
  n ? Math.max(40, Math.min(max, Math.floor((disponible - gap * (n - 1)) / n))) : 0;

// Columnas según cuántos horarios hay y el ancho disponible.
export const columnasHoras = (n, ancho) => {
  const maxCols = Math.max(1, Math.floor(ancho / 72));
  const ideal = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
  return Math.max(1, Math.min(ideal, maxCols));
};

// Tamaño de letra para que "10:30" entre en su celda (ancho y alto), entre `min` y `max`.
export const letraHoras = (n, ancho, alto, { min = 13, max = 46 } = {}) => {
  if (!n) return min;
  const cols = columnasHoras(n, ancho);
  const filas = Math.ceil(n / cols);
  const porAncho = (ancho / cols - 8) / 2.9;   // "10:30" en negrita ≈ 2,9 veces la letra
  const porAlto = (alto / filas) * 0.62;
  return Math.round(Math.max(min, Math.min(max, porAncho, porAlto)));
};

// Día corto ("lun 28") o largo ("lunes 28") en minúscula; el diseño lo pasa a mayúsculas.
export const etiquetaDia = (date, largo) =>
  `${date.toLocaleDateString('es-AR', { weekday: largo ? 'long' : 'short' }).replace('.', '')} ${date.getDate()}`;
