import { diasDesde, parseFecha, toISODate, todayStr } from './utils';

// Días antes de la fecha estimada en que un perro pasa a "le toca pronto".
export const AVISO_DIAS_ANTES = 7;
// Visitas separadas por menos que esto (p. ej. volvió por las uñas) no cuentan como ciclo.
const MIN_INTERVALO = 7;
// Cuántos intervalos recientes se usan para estimar la frecuencia.
const INTERVALOS_RECIENTES = 5;

const mediana = xs => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Calcula cada cuánto viene un perro a partir de sus visitas.
// Devuelve null si no hay datos suficientes (menos de 2 visitas en fechas distintas).
export function calcFrecuencia(visitas) {
  const fechas = [...new Set((visitas || []).map(v => v.fecha).filter(Boolean))].sort();
  if (fechas.length < 2) return null;
  const intervalos = [];
  for (let i = 1; i < fechas.length; i++) {
    const d = Math.round((parseFecha(fechas[i]) - parseFecha(fechas[i - 1])) / 86400000);
    if (d >= MIN_INTERVALO) intervalos.push(d);
  }
  if (!intervalos.length) return null;
  const cadaDias = mediana(intervalos.slice(-INTERVALOS_RECIENTES));
  const ultima = fechas[fechas.length - 1];
  const proxima = parseFecha(ultima);
  proxima.setDate(proxima.getDate() + cadaDias);
  const diasRestantes = -diasDesde(toISODate(proxima));
  return {
    cadaDias,
    ultima,
    diasDesdeUltima: diasDesde(ultima),
    proxima: toISODate(proxima),
    diasRestantes,
    estado: diasRestantes < 0 ? 'vencido' : diasRestantes <= AVISO_DIAS_ANTES ? 'pronto' : 'al_dia',
  };
}

export const fmtCada = dias => dias >= 14 ? `~${Math.round(dias / 7)} semanas` : `~${dias} días`;

export const fmtRestantes = f =>
  f.diasRestantes < 0 ? `Se pasó ${-f.diasRestantes} día${f.diasRestantes === -1 ? '' : 's'}`
  : f.diasRestantes === 0 ? 'Le toca hoy'
  : `Le toca en ${f.diasRestantes} día${f.diasRestantes === 1 ? '' : 's'}`;

// Clientes a los que les toca volver (o ya se pasaron) y no tienen un turno próximo agendado.
export function clientesParaVolver(clientes, turnos) {
  const hoy = todayStr();
  const conTurno = new Set(turnos.filter(t => t.fecha >= hoy && t.estado !== 'completed').map(t => t.clientId));
  return clientes
    .filter(c => !conTurno.has(c.id))
    .map(c => ({ cliente: c, frec: calcFrecuencia(c.visitas) }))
    .filter(x => x.frec && x.frec.estado !== 'al_dia')
    .sort((a, b) => a.frec.diasRestantes - b.frec.diasRestantes);
}
