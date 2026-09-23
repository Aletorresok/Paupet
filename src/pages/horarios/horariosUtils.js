const pad = n => String(n).padStart(2,'0');

// Date → "YYYY-MM-DD" en hora local.
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export const proximoLunes = () => {
  const d = new Date();
  const dia = d.getDay();
  const diff = dia === 1 ? 7 : ((8 - dia) % 7 || 7);
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
};

const OFFSETS = {lunes:0,martes:1,miercoles:2,jueves:3,viernes:4,sabado:5};
export const getDiaDate = (semanaInicio, dia) => {
  const d = new Date(semanaInicio);
  d.setDate(d.getDate() + (OFFSETS[dia]||0));
  return d;
};

const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// Rango de la semana (lunes a sábado) para mostrar en la imagen: "29 sep – 4 oct".
export const rangoSemana = (semanaInicio) => {
  const fin = new Date(semanaInicio);
  fin.setDate(fin.getDate() + 5);
  return `${semanaInicio.getDate()} ${MES_CORTO[semanaInicio.getMonth()]} – ${fin.getDate()} ${MES_CORTO[fin.getMonth()]}`;
};

// Genera horarios "HH:MM" entre desde y hasta cada `dur` minutos.
export const generarSlots = (desde, hasta, dur) => {
  const durN = parseInt(dur)||60;
  let [hh,mm] = desde.split(':').map(Number);
  const [eh,em] = hasta.split(':').map(Number);
  const gen = [];
  while (hh*60+mm+durN <= eh*60+em) {
    gen.push(`${pad(hh)}:${pad(mm)}`);
    mm += durN;
    if (mm>=60) { hh += Math.floor(mm/60); mm = mm%60; }
  }
  return gen;
};

// Renderiza un nodo del DOM a PNG con html2canvas (cargado on-demand) y lo descarga.
export const descargarNodoComoPng = async (node, filename, backgroundColor = '#7ec8a0') => {
  if (!window.html2canvas) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    await new Promise((res,rej) => { script.onload=res; script.onerror=rej; document.head.appendChild(script); });
  }
  await document.fonts.ready;
  const canvas = await window.html2canvas(node, {scale:2,useCORS:true,backgroundColor,logging:false,width:540,height:960});
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
