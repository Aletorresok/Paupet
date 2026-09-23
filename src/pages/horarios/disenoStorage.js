const KEY = 'paupet_diseno_story';

// Recuerda en este dispositivo qué diseño de imagen se eligió la última vez.
export const leerDiseno = () => {
  try { return localStorage.getItem(KEY) === 'nuevo' ? 'nuevo' : 'clasico'; } catch { return 'clasico'; }
};
export const guardarDiseno = d => {
  try { localStorage.setItem(KEY, d); } catch { /* sin almacenamiento: no pasa nada */ }
};
