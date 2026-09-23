const KEY = 'paupet_diseno_story';

// Diseños de la imagen para Stories. Los de `fondo` usan un fondo ilustrado (fondosStory.js).
export const DISENOS = [
  { id: 'clasico',   label: 'Clásico' },
  { id: 'nuevo',     label: 'Nuevo' },
  { id: 'menta',     label: 'Menta',     fondo: true },
  { id: 'crema',     label: 'Crema',     fondo: true },
  { id: 'salchicha', label: 'Salchicha', fondo: true },
];
export const esFondo = id => DISENOS.some(d => d.id === id && d.fondo);

// Recuerda en este dispositivo qué diseño de imagen se eligió la última vez.
export const leerDiseno = () => {
  try {
    const v = localStorage.getItem(KEY);
    return DISENOS.some(d => d.id === v) ? v : 'clasico';
  } catch { return 'clasico'; }
};
export const guardarDiseno = d => {
  try { localStorage.setItem(KEY, d); } catch { /* sin almacenamiento: no pasa nada */ }
};
