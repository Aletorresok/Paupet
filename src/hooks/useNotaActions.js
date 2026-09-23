import { db } from '../lib/db';
import { todayStr } from '../lib/utils';
import { CLOSED_NOTA } from './useModals';

export function useNotaActions({ notas, setNotas, loadAll, toast, askConfirm, modals }) {
  const { setModalNota } = modals;

  const handleSaveNota = async (tipo, form, editId=null) => {
    if (tipo==='compra' && !form.item) { toast('Completá el item a comprar', true); return; }
    if (tipo==='egreso' && (!form.concepto || !form.monto)) { toast('Completá concepto y monto', true); return; }
    try {
      if (editId) {
        const fields = tipo==='compra'
          ? {item:form.item, cantidad:parseInt(form.cantidad)||1, precio:parseFloat(form.precio)||0, notas_texto:form.notas||''}
          : {concepto:form.concepto, categoria:form.categoria||'', monto:parseFloat(form.monto)||0, fecha:form.fecha||todayStr()};
        await db.updateNota(editId, fields);
        toast('Nota actualizada ✅');
      } else {
        await db.insertNota({tipo, ...form, monto:parseFloat(form.monto)||0, precio:parseFloat(form.precio)||0, cantidad:parseInt(form.cantidad)||1});
        toast(tipo==='compra'?'Item agregado 🛒':'Egreso registrado 💸');
      }
      setModalNota(CLOSED_NOTA);
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  const handleToggleCompra = async id => {
    const n = notas.find(x=>x.id===id); if (!n) return;
    try {
      await db.updateNota(id, {completada:!n.completada});
      setNotas(ns => ns.map(x => x.id===id ? {...x,completada:!x.completada} : x));
    } catch(e) { toast(e.message, true); await loadAll(); }
  };

  const handleDeleteNota = async id => {
    const ok = await askConfirm('¿Eliminar esta nota?');
    if (!ok) return;
    try {
      await db.deleteNota(id);
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  return { handleSaveNota, handleToggleCompra, handleDeleteNota };
}
