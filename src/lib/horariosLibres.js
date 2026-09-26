// Misma regla que la función SQL `horarios_libres()` (supabase/migracion_04_horarios_base.sql).
// La usa el modo demo y los tests; si se cambia una, hay que cambiar la otra.
//
// Para cada día de los próximos (hasta 21):
//  - si tiene horarios en "Horarios para Stories", se usan ésos;
//  - si no, los horarios base de Configuración de ese día de la semana (si está abierto),
//    hasta los días de anticipación configurados.
// Se descartan: días apagados en Stories, horarios tomados, los de menos de 1 hora desde `ahora`
// y los que se pisan con un turno (teniendo en cuenta ambas duraciones).

const CLAVES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const pad = n => String(n).padStart(2, '0');
const aKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const aMin = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };

export function calcularHorariosLibres(config, turnos, ahora = new Date()) {
  const h = config?.horarios_semanales || {};
  const base = config?.slots || {};
  const abiertos = config?.horarios || {};
  const dias = Math.min(Math.max(Number(config?.anticip) || 21, 1), 21);
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const limite = aKey(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 21));

  const ofrecidos = [];
  const conStories = new Set();
  for (const [fecha, horas] of Object.entries(h.slots || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Array.isArray(horas)) continue;
    horas.forEach(hora => { ofrecidos.push({ fecha, hora, minutos: 60 }); conStories.add(fecha); });
  }
  for (let i = 0; i <= dias; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const fecha = aKey(d), clave = CLAVES[d.getDay()];
    if (conStories.has(fecha) || abiertos[clave]?.open === false || !Array.isArray(base[clave])) continue;
    base[clave].forEach(s => {
      const hora = typeof s === 'object' && s ? s.hora : s;
      ofrecidos.push({ fecha, hora, minutos: Number(typeof s === 'object' && s?.duracion) || 60 });
    });
  }

  const vistos = new Set();
  return ofrecidos.filter(({ fecha, hora, minutos }) => {
    if (typeof hora !== 'string' || !HORA.test(hora)) return false;
    if (fecha < aKey(hoy) || fecha > limite) return false;
    const [y, m, dd] = fecha.split('-').map(Number);
    if (new Date(y, m - 1, dd, ...hora.split(':').map(Number)) - ahora <= 3600000) return false;
    if ((h.diasActivos || []).includes('NO:' + fecha)) return false;
    if ((h.tomados?.[fecha] || []).includes(hora)) return false;
    const desde = aMin(hora), hasta = desde + Math.max(minutos, 1);
    const pisa = turnos.some(t => t.fecha === fecha && /^\d{1,2}:\d{2}/.test(t.hora || '') &&
      desde < aMin(t.hora) + (t.duracion || 60) && aMin(t.hora) < hasta);
    const k = fecha + hora;
    if (pisa || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  }).map(({ fecha, hora }) => ({ fecha, hora }))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
}
