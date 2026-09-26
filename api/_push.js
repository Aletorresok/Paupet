// Utilidades compartidas por las funciones de Vercel que mandan avisos al celular.
// (Los archivos que empiezan con "_" no son rutas: sólo se importan.)
//
// Variables de entorno en Vercel (Settings → Environment Variables):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  → claves de los avisos (las mismas que usa la app)
//   WEBHOOK_SECRET                       → contraseña que manda Supabase al avisar un pedido nuevo
//   SUPABASE_SERVICE_ROLE_KEY            → Supabase → Settings → API → service_role (secreta)
import webpush from 'web-push';

export const SUPABASE_URL = 'https://qelrwbavnrxdlxfckehz.supabase.co';
const VARIABLES = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

export const faltanVariables = (extra = []) => [...VARIABLES, ...extra].filter(v => !process.env[v]);

const cabeceras = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

// Celulares suscriptos (opcionalmente sólo los de un usuario).
async function suscripciones(usuario) {
  const filtro = usuario ? `&usuario=eq.${encodeURIComponent(usuario)}` : '';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_suscripciones?select=*${filtro}`, { headers: cabeceras() });
  if (!r.ok) throw new Error(`No se pudieron leer las suscripciones (${r.status}): ${await r.text()}`);
  return r.json();
}

const borrar = endpoint => fetch(`${SUPABASE_URL}/rest/v1/push_suscripciones?endpoint=eq.${encodeURIComponent(endpoint)}`,
  { method: 'DELETE', headers: cabeceras() });

// Manda el aviso a todos los celulares (o a los de `usuario`). Borra los que ya no existen.
export async function enviarAviso(aviso, usuario) {
  webpush.setVapidDetails('mailto:avisos@paupet.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const subs = await suscripciones(usuario);
  let enviados = 0;
  await Promise.all(subs.map(async s => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(aviso), { TTL: 60 * 60 * 24, urgency: 'high' });
      enviados++;
    } catch (e) {
      // 404/410: el celular desinstaló la app o bloqueó los avisos.
      if (e.statusCode === 404 || e.statusCode === 410) await borrar(s.endpoint);
      else console.error('Aviso no enviado', e.statusCode, e.body);
    }
  }));
  return { celulares: subs.length, enviados };
}
