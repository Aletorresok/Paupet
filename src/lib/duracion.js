// Duraciones posibles de un turno (minutos) y cómo mostrarlas.
export const DURACIONES = [30, 45, 60, 75, 90, 120, 150, 180];
export const fmtDuracion = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}`;

export const aMinutos = hhmm => { const [h, m] = (hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
export const aHora = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
