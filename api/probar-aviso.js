// "Probar aviso" desde Configuración: manda un aviso de prueba a los celulares de quien lo pide.
// Sólo para usuarios logueados (se verifica su sesión con Supabase).
import { SUPABASE_URL, enviarAviso, faltanVariables } from './_push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sólo POST' });
  const faltan = faltanVariables();
  if (faltan.length) return res.status(500).json({ error: `Faltan variables en Vercel: ${faltan.join(', ')}` });

  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!token || !r.ok) return res.status(401).json({ error: 'Hay que iniciar sesión' });
  const { email } = await r.json();

  try {
    const resultado = await enviarAviso({ title: 'Paupet · aviso de prueba', body: '¡Listo! Así te van a llegar los pedidos de turno. 🐾', url: '/', tag: 'prueba' }, email);
    return res.status(200).json(resultado);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
