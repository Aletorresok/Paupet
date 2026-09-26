import { db } from '../lib/db';
import { mensajeConfirmado, mensajePropuesta, mensajeRechazo, turnoDesdePedido } from '../lib/pedidos';
import { todayStr } from '../lib/utils';
import { abrirChat } from '../lib/whatsapp';

// Acciones sobre los pedidos de /turnos. WhatsApp se abre primero (en el mismo toque, para que el
// celular no lo bloquee) y después se guarda el cambio de estado.
export function usePedidoActions({ clientes, turnos, loadAll, toast, modals }) {
  const { setModalTurno, setModalProponer } = modals;

  const guardar = async (id, campos, aviso) => {
    try {
      await db.updatePedido(id, campos);
      await loadAll();
      if (aviso) toast(aviso);
    } catch (e) { toast(e.message, true); }
  };

  // Abre "Nuevo turno" ya cargado: con el horario pedido, el propuesto o (si no hay) hoy sin hora.
  const agendar = p => {
    const [fecha, hora] = p.estado === 'propuesto' && p.fecha_prop ? [p.fecha_prop, p.hora_prop]
      : p.fecha ? [p.fecha, p.hora] : [todayStr(), ''];
    setModalTurno(turnoDesdePedido(p, clientes, fecha, hora));
  };

  const proponer = p => setModalProponer({ open: true, pedido: p });

  const enviarPropuesta = (p, fecha, hora) => {
    abrirChat(p.tel, mensajePropuesta(p, fecha, hora));
    setModalProponer({ open: false, pedido: null });
    guardar(p.id, { estado: 'propuesto', fecha_prop: fecha, hora_prop: hora }, 'Propuesta enviada · queda esperando respuesta');
  };

  const rechazar = (p, avisar) => {
    if (avisar) abrirChat(p.tel, mensajeRechazo(p));
    guardar(p.id, { estado: 'rechazado' }, 'Pedido rechazado');
  };

  // Ya agendado: le manda la confirmación con el día y hora del turno.
  const avisarConfirmado = p => {
    const t = turnos.find(x => x.id === p.turno_id);
    const [fecha, hora] = t ? [t.fecha, t.hora] : p.fecha_prop ? [p.fecha_prop, p.hora_prop] : [p.fecha, p.hora];
    abrirChat(p.tel, mensajeConfirmado(p, fecha, hora));
    guardar(p.id, { avisado: true });
  };

  const marcarAvisado = p => guardar(p.id, { avisado: true });

  return { agendar, proponer, enviarPropuesta, rechazar, avisarConfirmado, marcarAvisado };
}
