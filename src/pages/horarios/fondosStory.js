import menta from '../../assets/fondos/menta.webp';
import crema from '../../assets/fondos/crema.webp';
import salchicha from '../../assets/fondos/salchicha.webp';

// Fondos ilustrados (Gemini) para la imagen de Stories. Cada uno deja libre el centro:
// `zona` es el rectángulo (en px sobre 540×960) donde van título y horarios, sin pisar los dibujos.
export const FONDOS = {
  menta:     { img: menta,     color: '#77C39E', zona: { top: 128, bottom: 150, x: 92 }, compacto: false },
  crema:     { img: crema,     color: '#F6F2EC', zona: { top: 128, bottom: 150, x: 92 }, compacto: false },
  salchicha: { img: salchicha, color: '#9AD2B4', zona: { top: 128, bottom: 318, x: 92 }, compacto: true },
};
