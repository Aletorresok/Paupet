import { WHATSAPP_PAU } from '../../lib/constants';
import { DIAS_ES } from '../../lib/constants';
import { parseFecha } from '../../lib/utils';

// "2026-09-25" + "10:30" → "viernes 25/9 a las 10:30"
export function describirHorario(fecha, hora) {
  const d = parseFecha(fecha);
  return `${DIAS_ES[d.getDay()].toLowerCase()} ${d.getDate()}/${d.getMonth() + 1} a las ${hora}`;
}

// Cuándo, en palabras: el horario elegido o la preferencia escrita a mano.
export function describirCuando({ horario, preferencia, franja }) {
  if (horario) return describirHorario(horario.fecha, horario.hora);
  const partes = [preferencia.trim()];
  if (franja === 'Me da igual') partes.push('cualquier horario');
  else if (franja) partes.push(`a la ${franja.toLowerCase()}`);
  return partes.filter(Boolean).join(', ');
}

// Arma el mensaje para Pau y la lista de lo que falta completar.
export function armarMensaje(f) {
  const cuando = describirCuando(f);
  const desc = [f.raza.trim(), f.tamanio && f.tamanio.toLowerCase()].filter(Boolean).join(', ');
  const notas = [...f.aTenerEnCuenta, f.comentario.trim()].filter(Boolean);
  const lineas = [
    '¡Hola Pau! Quiero pedir un turno 🐾',
    '',
    `*Perro:* ${f.perro.trim() || '…'}${desc ? ` (${desc})` : ''}`,
    f.vinoAntes && (f.vinoAntes === 'Sí, ya vino' ? '*Ya vino antes* ✅' : '*Es la primera vez* ✨'),
    `*Servicio:* ${f.servicios.join(' + ') || '…'}`,
    `*Cuándo:* ${cuando || '…'}`,
    notas.length > 0 && `*Para tener en cuenta:* ${notas.join(', ')}`,
    `*Soy:* ${f.duenio.trim() || '…'}`,
    '',
    '¿Tenés disponible? ¡Gracias!',
  ].filter(l => l !== false && l !== undefined && l !== null);

  const faltan = [];
  if (!f.perro.trim()) faltan.push('el nombre del perro');
  if (!f.duenio.trim()) faltan.push('tu nombre');
  if (f.servicios.length === 0) faltan.push('un servicio');
  if (!cuando) faltan.push('cuándo te queda bien');

  return { texto: lineas.join('\n'), faltan };
}

export const linkWhatsApp = texto => `https://wa.me/${WHATSAPP_PAU}?text=${encodeURIComponent(texto)}`;
