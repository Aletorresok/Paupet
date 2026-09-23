import { C } from '../../../lib/styles';

export const SUGERENCIAS = ['Miedo al secador', 'Muerde', 'Nervioso/a', 'Dócil', 'Alergia: ', 'No tolera el agua caliente', 'Le gusta el moño'];

// Color de una etiqueta según su contenido: alergias en rosa, cuidados en ámbar, el resto en verde.
export function colorEtiqueta(texto) {
  if (/alerg/i.test(texto)) return { bg: C.rosaSuave, fg: C.rosa };
  if (/miedo|muerde|mord|nervio|agresiv|cuidado|no tolera|ansios/i.test(texto)) return { bg: C.ambarSuave, fg: C.ambar };
  return { bg: C.mentaSuave, fg: C.verde };
}

// Otros perros del mismo dueño (mismo nombre de dueño, o mismo teléfono).
export function perrosDelDueno(cliente, clientes) {
  const norm = s => (s || '').toLowerCase().trim();
  const tel = s => (s || '').replace(/\D/g, '').slice(-8);
  return clientes.filter(c => c.id !== cliente.id && (
    (norm(c.owner) && norm(c.owner) === norm(cliente.owner)) ||
    (tel(c.tel).length >= 8 && tel(c.tel) === tel(cliente.tel))
  ));
}
