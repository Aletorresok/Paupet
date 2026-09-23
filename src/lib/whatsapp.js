import { fmtFecha } from './utils';

export const abrirWhatsApp = (tel, dogName, ownerName, turno = null) => {
  if (!tel) return;
  let num = tel.replace(/[\s\-()]/g, '');
  if (!num.startsWith('+') && !num.startsWith('549')) {
    num = num.replace(/^0/, '');
    num = '549' + num;
  } else {
    num = num.replace('+', '');
  }
  let msg;
  if (turno) {
    msg = `¡Hola ${ownerName}! 🐾 Te recordamos el turno de *${dogName}* para el *${fmtFecha(turno.fecha)}* a las *${turno.hora}hs*. ¡Te esperamos! ✂️`;
  } else {
    msg = `¡Hola ${ownerName}! Te contactamos desde Paupet Peluquería Canina 🐾`;
  }
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
};
