import { MESES } from './constants';

const pad2 = n => String(n).padStart(2,'0');

// Fecha local (no UTC) en formato "YYYY-MM-DD".
export const toISODate = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
export const todayStr = () => toISODate(new Date());

// "YYYY-MM-DD" → Date a medianoche local (new Date('YYYY-MM-DD') la interpreta en UTC).
export const parseFecha = f => {
  const [y, m, d] = f.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Días enteros desde una fecha "YYYY-MM-DD" hasta hoy.
export const diasDesde = f => Math.round((parseFecha(todayStr()) - parseFecha(f)) / 86400000);

export const fmtFecha = f => {
  if (!f) return '–';
  const [y, m, d] = f.split('-');
  if (!y || !m || !d) return f;
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} ${y}`;
};

export const fmtPeso = n => '$' + (n || 0).toLocaleString('es-AR');

// "2026-03" → "marzo 2026"
export const fmtMes = m => {
  const [yy, mm] = m.split('-');
  return `${MESES[parseInt(mm)-1]} ${yy}`;
};

export const animalIcon = (raza = '') => {
  const r = raza.toLowerCase();
  if (r.includes('caniche') || r.includes('poodle')) return '🐩';
  if (r.includes('golden')) return '🦮';
  if (r.includes('gato')) return '🐱';
  return '🐶';
};

export const durLabel = min => {
  if (min < 60) return min + ' min';
  if (min === 60) return '1 hora';
  if (min === 90) return '1:30 hs';
  if (min === 120) return '2 horas';
  return min + 'min';
};

export const getSlotsDelDia = (slots, fechaKey) => {
  if (slots[fechaKey] && slots[fechaKey].length > 0) return slots[fechaKey];
  return [];
};
