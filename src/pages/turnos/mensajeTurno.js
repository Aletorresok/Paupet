import { WHATSAPP_PAU } from '../../lib/constants';
import { DIAS_ES } from '../../lib/constants';
import { parseFecha } from '../../lib/utils';

// Teléfono válido para WhatsApp: entre 8 y 15 dígitos.
export const telValido = tel => { const d = (tel || '').replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; };

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

  // Lo que falta, en orden, con el id del campo o sección a donde llevar a la persona.
  const pendientes = [
    !f.perro.trim() && ['el nombre del perro', 'pt-perro'],
    !f.duenio.trim() && ['tu nombre', 'pt-duenio'],
    !telValido(f.tel) && ['tu WhatsApp', 'pt-tel'],
    f.servicios.length === 0 && ['un servicio', 'pt-t-serv'],
    !cuando && ['cuándo te queda bien', 'pt-t-cuando'],
  ].filter(Boolean);

  return { texto: lineas.join('\n'), faltan: pendientes.map(p => p[0]), primerFaltante: pendientes[0]?.[1] || null };
}

export const linkWhatsApp = texto => `https://wa.me/${WHATSAPP_PAU}?text=${encodeURIComponent(texto)}`;
