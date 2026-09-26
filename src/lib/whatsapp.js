import { DIAS_ES, MESES } from './constants';
import { diasDesde, fmtFecha, parseFecha } from './utils';

// "mañana lunes 28 de septiembre" / "el lunes 28 de septiembre" (sin el año).
const fechaAmigable = f => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) return fmtFecha(f);
  const d = parseFecha(f);
  const txt = `${DIAS_ES[d.getDay()].toLowerCase()} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const dias = -diasDesde(f);
  return dias === 0 ? `hoy ${txt}` : dias === 1 ? `mañana ${txt}` : `el ${txt}`;
};

const normalizarTel = tel => {
  let num = tel.replace(/[\s\-()]/g, '');
  if (!num.startsWith('+') && !num.startsWith('549')) {
    num = num.replace(/^0/, '');
    num = '549' + num;
  } else {
    num = num.replace('+', '');
  }
  return num;
};

const abrirChat = (tel, msg) => {
  window.open(`https://wa.me/${normalizarTel(tel)}?text=${encodeURIComponent(msg)}`, '_blank');
};

export const abrirWhatsApp = (tel, dogName, ownerName, turno = null) => {
  if (!tel) return;
  let msg;
  if (turno) {
    msg = `¡Hola ${ownerName}! 🐾 Te recordamos el turno de *${dogName}* para *${fechaAmigable(turno.fecha)}*${turno.hora ? ` a las *${turno.hora}hs*` : ''}. ¡Te esperamos! ✂️`;
  } else {
    msg = `¡Hola ${ownerName}! Te contactamos desde Paupet Peluquería Canina 🐾`;
  }
  abrirChat(tel, msg);
};

// Mensaje para invitar a un cliente a volver cuando ya le toca.
export const abrirWhatsAppVuelta = (tel, dogName, ownerName) => {
  if (!tel) return;
  abrirChat(tel, `¡Hola ${ownerName}! 🐾 ¿Cómo está ${dogName}? Ya se está por cumplir el tiempo de su próximo baño. ¿Querés que le reservemos un turno? ✂️`);
};
