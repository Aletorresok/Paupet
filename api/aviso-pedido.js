// La llama Supabase (Database → Webhooks) cada vez que entra un pedido de turno nuevo.
// Manda el aviso a los celulares donde se activaron los avisos.
import { enviarAviso, faltanVariables } from './_push.js';
import { textoAvisoPedido } from '../src/lib/avisoPedido.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sólo POST' });
  const faltan = faltanVariables(['WEBHOOK_SECRET']);
  if (faltan.length) return res.status(500).json({ error: `Faltan variables en Vercel: ${faltan.join(', ')}` });
  if (req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) return res.status(401).json({ error: 'Secreto incorrecto' });

  const { type, table, record } = req.body || {};
  if (type !== 'INSERT' || table !== 'pedidos_turno' || !record) return res.status(200).json({ ignorado: true });

  try {
    const resultado = await enviarAviso({ ...textoAvisoPedido(record), url: '/', tag: `pedido-${record.id}` });
    return res.status(200).json(resultado);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
