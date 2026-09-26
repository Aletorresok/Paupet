// Texto del aviso al celular cuando entra un pedido de turno. Lo usa la función de Vercel
// (api/aviso-pedido.js), así que no importa nada de la app: sólo JavaScript plano.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const cuando = (fecha, hora) => {
  const [y, m, d] = String(fecha).split('-').map(Number);
  const dia = new Date(y, m - 1, d);
  return `${DIAS[dia.getDay()]} ${d}/${m}${hora ? ` ${hora}` : ''}`;
};

export function textoAvisoPedido(p) {
  const horario = p.fecha ? cuando(p.fecha, p.hora) : p.preferencia ? `sin horario: "${p.preferencia}"` : 'sin horario';
  return {
    title: `Nuevo pedido de turno · ${p.perro}`,
    body: [`${p.duenio}${p.servicios ? ` · ${p.servicios}` : ''}`, horario].join('\n'),
  };
}
