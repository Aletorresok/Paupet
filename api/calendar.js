// Lee el calendario de Google de Pau (su "dirección secreta en formato iCal") y devuelve sólo los turnos:
// los eventos con 🐶 o la palabra "turno" en el título. El resto se descarta acá y no sale de esta función.
// Hace falta porque el navegador no puede leer esa dirección directamente.
// Sólo para usuarios logueados (se verifica su sesión con Supabase). No guarda nada.
import { SUPABASE_URL } from './_push.js';
import { URL_CALENDAR, turnosDelCalendario } from '../src/lib/ical.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sólo POST' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Falta la variable SUPABASE_SERVICE_ROLE_KEY en Vercel' });

  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const sesion = token && await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!sesion || !sesion.ok) return res.status(401).json({ error: 'Hay que iniciar sesión' });

  const url = String(req.body?.url || '').trim().replace(/^webcal:/, 'https:');
  if (!URL_CALENDAR.test(url)) return res.status(400).json({ error: 'Esa no es la dirección secreta de Google Calendar (termina en basic.ics)' });

  try {
    const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!r.ok) return res.status(502).json({ error: r.status === 404 ? 'Google no encuentra ese calendario: revisá la dirección' : `Google respondió ${r.status}` });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(turnosDelCalendario(await r.text()));
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'No se pudo leer el calendario: ' + e.message });
  }
}
