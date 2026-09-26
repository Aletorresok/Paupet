import { DIAS_ES } from './constants';
import { normalizar } from './duenos';
import { parseFecha } from './utils';

// Pedidos de turno hechos en /turnos (tabla pedidos_turno, migración 5).
// Estados: nuevo (sin responder) · propuesto (Pau ofreció otro horario) · aceptado · rechazado.

const telCorto = t => (t || '').replace(/\D/g, '').slice(-8);

// Los que Pau tiene que atender: sin responder, esperando respuesta a una propuesta,
// o ya agendados a los que falta avisarles por WhatsApp.
export const pedidosPendientes = pedidos => pedidos.filter(p =>
  p.estado === 'nuevo' || p.estado === 'propuesto' || (p.estado === 'aceptado' && !p.avisado));

// A quién corresponde el pedido: el mismo perro ya cargado, otro perro de un dueño conocido, o nadie.
// Se busca por teléfono (últimos 8 dígitos) y, si no hay teléfono cargado, por nombre de perro y dueño.
export function clienteDelPedido(p, clientes) {
  const tel = telCorto(p.tel);
  const perro = normalizar(p.perro);
  const delTel = tel.length === 8 ? clientes.filter(c => telCorto(c.tel) === tel) : [];
  const mismo = delTel.find(c => normalizar(c.dog) === perro)
    || clientes.find(c => normalizar(c.dog) === perro && normalizar(c.owner).startsWith(normalizar(p.duenio).split(' ')[0] || '-'));
  if (mismo) return { tipo: 'mismo', cliente: mismo };
  if (delTel.length) return { tipo: 'dueno', cliente: delTel[0] };
  return { tipo: 'nuevo', cliente: null };
}

// "lunes 28/9 a las 16:00"
export const cuandoCorto = (fecha, hora) => {
  if (!fecha) return '';
  const d = parseFecha(fecha);
  return `${DIAS_ES[d.getDay()].toLowerCase()} ${d.getDate()}/${d.getMonth() + 1}${hora ? ` a las ${hora}` : ''}`;
};

const TAMANIO = { Chico: 'Pequeño', Mediano: 'Mediano', Grande: 'Grande' };

// Datos para abrir "Nuevo turno" ya cargado a partir de un pedido (y el horario a usar).
export function turnoDesdePedido(p, clientes, fecha, hora) {
  const { tipo, cliente } = clienteDelPedido(p, clientes);
  const base = { pedidoId: p.id, fecha, hora: hora || undefined, servicio: p.servicios, turnoEdit: null, open: true };
  if (tipo === 'mismo') return { ...base, clientId: cliente.id };
  return {
    ...base,
    nuevo: {
      dog: p.perro, raza: p.raza, size: TAMANIO[p.tamanio] || '', notes: p.notas,
      // Si el dueño ya es cliente, se usa su nombre tal cual para que la ficha agrupe a sus perros.
      owner: tipo === 'dueno' ? cliente.owner : p.duenio,
      tel: tipo === 'dueno' && cliente.tel ? cliente.tel : p.tel,
    },
  };
}

// Mensajes de WhatsApp de Pau al cliente.
export const mensajeConfirmado = (p, fecha, hora) =>
  `¡Hola ${p.duenio}! 🐾 Te confirmo el turno de *${p.perro}* para el *${cuandoCorto(fecha, hora)}${hora ? 'hs' : ''}*. ¡Te esperamos! ✂️`;

export const mensajePropuesta = (p, fecha, hora) => (p.fecha
  ? `¡Hola ${p.duenio}! 🐾 Gracias por pedir turno para *${p.perro}*. El ${cuandoCorto(p.fecha, p.hora)} no tengo lugar, ¿te sirve el *${cuandoCorto(fecha, hora)}${hora ? 'hs' : ''}*?`
  : `¡Hola ${p.duenio}! 🐾 Gracias por pedir turno para *${p.perro}*. ¿Te sirve el *${cuandoCorto(fecha, hora)}${hora ? 'hs' : ''}*?`);

export const mensajeRechazo = p =>
  `¡Hola ${p.duenio}! 🐾 Gracias por escribir. Por ahora no tengo turnos disponibles para *${p.perro}*. Apenas se libere uno te aviso.`;
