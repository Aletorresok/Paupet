import { db } from '../lib/db';

export function useClienteActions({ clientes, loadAll, toast, askConfirm, modals }) {
  const { modalNuevoCliente, setModalCliente, setModalNuevoCliente } = modals;

  const handleSaveVisit = async (clienteId, svc, precio, fecha, formaPago) => {
    if (!svc) { toast('Ingresá el servicio', true); return; }
    try {
      await db.insertVisita(clienteId, svc, precio, fecha, formaPago);
      await loadAll();
      toast('Visita registrada ✂️');
    } catch(e) { toast(e.message, true); }
  };

  const handleEditVisit = async (visitaId, svc, precio, fecha, formaPago) => {
    try {
      await db.updateVisita(visitaId, {servicio:svc, precio, fecha, forma_pago: formaPago});
      await loadAll();
      toast('Visita actualizada ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteVisit = async (visitaId) => {
    const ok = await askConfirm('¿Eliminar esta visita del historial?');
    if (!ok) return;
    try {
      await db.deleteVisita(visitaId);
      await loadAll();
      toast('Visita eliminada');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteClient = async id => {
    const ok = await askConfirm('¿Eliminar este cliente y todas sus visitas?');
    if (!ok) return;
    try {
      await db.deleteCliente(id);
      setModalCliente({open:false,id:null});
      await loadAll();
      toast('Cliente eliminado');
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveNewClient = async (form, fotoFile) => {
    if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return; }
    const isEdit = !!modalNuevoCliente.initial;
    try {
      let fotoUrl = form.foto;
      if (fotoFile) {
        const tempId = modalNuevoCliente.initial?.id || 'new_' + Date.now();
        fotoUrl = await db.uploadFoto(fotoFile, tempId);
      }
      const formConFoto = { ...form, foto: fotoUrl };
      if (isEdit) {
        await db.updateCliente(modalNuevoCliente.initial.id, formConFoto);
      } else {
        await db.insertCliente(formConFoto);
      }
      setModalNuevoCliente({open:false,initial:null});
      await loadAll();
      toast(isEdit ? 'Cliente actualizado ✅' : `¡${form.dog} fue agregado! 🐶`);
    } catch(e) { toast(e.message, true); }
  };

  const handleDecrementarInasistencia = async id => {
    const ok = await askConfirm('¿Restar una inasistencia?');
    if (!ok) return;
    const c = clientes.find(x=>x.id===id);
    if (!c || (c.inasistencias||0) <= 0) return;
    try {
      await db.updateCliente(id, {inasistencias: c.inasistencias - 1});
      await loadAll();
      toast('Inasistencia eliminada');
    } catch(e) { toast(e.message, true); }
  };

  return { handleSaveVisit, handleEditVisit, handleDeleteVisit, handleDeleteClient, handleSaveNewClient, handleDecrementarInasistencia };
}
