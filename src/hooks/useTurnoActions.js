import { db } from '../lib/db';
import { CLOSED_TURNO, CLOSED_COBRO } from './useModals';

export function useTurnoActions({ clientes, turnos, loadAll, toast, askConfirm, modals }) {
  const { setModalTurno } = modals;

  // Abre la ventana "Completar y cobrar".
  const handleCompletar = (id) => modals.setModalCobro({ open: true, turnoId: id });

  // Completa el turno con lo que efectivamente se cobró y lo guarda en el historial.
  const handleCobrar = async (id, { servicio, precio, formaPago }) => {
    const t = turnos.find(x=>x.id===id); if (!t) return;
    if (t.estado === 'completed') { modals.setModalCobro(CLOSED_COBRO); return; }
    try {
      const marcado = await db.completarTurno(id, { servicio, precio, forma_pago: formaPago });
      modals.setModalCobro(CLOSED_COBRO);
      if (!marcado) { await loadAll(); return; }
      if (t.clientId) {
        try {
          await db.insertVisita(t.clientId, servicio, precio, t.fecha, formaPago);
        } catch(e) {
          // Si no se pudo guardar la visita, el turno vuelve a quedar como estaba.
          await db.updateTurno(id, {estado: t.estado});
          throw e;
        }
      }
      await loadAll();
      toast(`Cobrado ${'$'}${Number(precio).toLocaleString('es-AR')} · guardado en el historial`);
    } catch(e) { toast(e.message, true); }
  };

  const handleNoVino = async (id) => {
    const ok = await askConfirm('¿Marcar este turno como inasistencia?');
    if (!ok) return;
    modals.setModalCobro(CLOSED_COBRO);
    const t = turnos.find(x=>x.id===id); if (!t) return;
    const c = clientes.find(x=>x.id===t.clientId);
    try {
      await db.deleteTurno(id);
      if (c) await db.updateCliente(c.id, {inasistencias:(c.inasistencias||0)+1});
      await loadAll();
      toast('Inasistencia registrada 📍');
    } catch(e) { toast(e.message, true); }
  };

  const handleConfirmar = async id => {
    try {
      await db.updateTurno(id, {estado:'confirmed'});
      await loadAll();
      toast('Turno confirmado ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleEditTurno = (turno) => {
    setModalTurno({open:true, fecha:turno.fecha, turnoEdit:turno});
  };

  const handleUpdateTurno = async (id, fields) => {
    try {
      await db.updateTurno(id, fields);
      setModalTurno(CLOSED_TURNO);
      await loadAll();
      toast('Turno actualizado ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteTurno = async id => {
    const ok = await askConfirm('¿Eliminar este turno?');
    if (!ok) return;
    try {
      await db.deleteTurno(id);
      await loadAll();
      toast('Turno eliminado');
    } catch(e) { toast(e.message, true); }
  };

  // Resuelve el cliente del turno: existente, o lo crea (reutilizando uno con mismo perro+dueño).
  const resolverCliente = async (mode, form) => {
    if (mode !== 'new') {
      const clientId = parseInt(form.clientId);
      if (!clientId || isNaN(clientId)) { toast('Seleccioná un cliente', true); return null; }
      return { clientId, dogName: '' };
    }
    if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return null; }
    const existe = clientes.find(c =>
      (c.dog || '').toLowerCase().trim() === form.dog.toLowerCase().trim() &&
      (c.owner || '').toLowerCase().trim() === form.owner.toLowerCase().trim()
    );
    if (existe) return { clientId: existe.id, dogName: existe.dog };
    const newC = await db.insertCliente({dog:form.dog,owner:form.owner,raza:form.raza||'',tel:form.tel||'',size:'',pelaje:'',notes:'',foto:null});
    if (!newC?.id) throw new Error('No se pudo crear el cliente.');
    return { clientId: newC.id, dogName: form.dog };
  };

  const handleSaveNewTurno = async (mode, form) => {
    try {
      const resuelto = await resolverCliente(mode, form);
      if (!resuelto) return;
      const { clientId, dogName } = resuelto;
      if (!form.fecha) { toast('Completá la fecha del turno', true); return; }
      if (!form.svc)   { toast('Completá el servicio del turno', true); return; }
      const c = clientes.find(x => x.id === clientId) || {};
      await db.insertTurno({
        clientId,
        dogName: dogName || c.dog || '',
        servicio: form.svc,
        fecha: form.fecha,
        hora: form.hora || '',
        precio: parseFloat(form.precio) || 0,
        estado: form.estado || 'confirmed',
        formaPago: form.formaPago || 'efectivo',
      });
      setModalTurno(CLOSED_TURNO);
      await loadAll();
      toast('Turno agregado 📅');
    } catch(e) { toast('Error: ' + e.message, true); }
  };

  return { handleCompletar, handleCobrar, handleNoVino, handleConfirmar, handleEditTurno, handleUpdateTurno, handleDeleteTurno, handleSaveNewTurno };
}
