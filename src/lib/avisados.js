// Recordatorios ya enviados por WhatsApp (sólo en este dispositivo: la base no se toca).
// Se guarda {turnoId: fecha del turno}; los de turnos ya pasados se limpian solos.
import { todayStr } from './utils';

const KEY = 'paupet_avisados';

const leer = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function avisados() {
  const hoy = todayStr();
  return Object.fromEntries(Object.entries(leer()).filter(([, fecha]) => fecha >= hoy));
}

export function marcarAvisado(turno) {
  const todos = { ...avisados(), [turno.id]: turno.fecha };
  try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch { /* sin almacenamiento */ }
  return todos;
}
