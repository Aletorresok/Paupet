import ConfirmDialog from './components/ui/ConfirmDialog';
import ModalCliente from './pages/clientes/ModalCliente';
import ModalClienteForm from './pages/clientes/ModalClienteForm';
import ModalTurno from './pages/calendario/ModalTurno';
import ModalNota from './pages/notas/ModalNota';
import { CLOSED_TURNO, CLOSED_NOTA } from './hooks/useModals';

export default function AppModals({ modals, clientes, clienteActions: ca, turnoActions: ta, notaActions: na, confirm, closeConfirm }) {
  const { modalCliente, setModalCliente, modalNuevoCliente, setModalNuevoCliente, modalTurno, setModalTurno, modalNota, setModalNota } = modals;
  const activeCliente = clientes.find(c=>c.id===modalCliente.id);

  return (
    <>
      <ModalCliente
        open={modalCliente.open} cliente={activeCliente}
        onClose={()=>setModalCliente({open:false,id:null})}
        onSaveVisit={ca.handleSaveVisit}
        onEditVisit={ca.handleEditVisit}
        onDeleteVisit={ca.handleDeleteVisit}
        onDelete={ca.handleDeleteClient}
        onEdit={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:c});}}
        onDecrementarInasistencia={ca.handleDecrementarInasistencia}
      />
      <ModalClienteForm
        open={modalNuevoCliente.open} initial={modalNuevoCliente.initial}
        onClose={()=>setModalNuevoCliente({open:false,initial:null})}
        onSave={ca.handleSaveNewClient}
      />
      <ModalTurno
        open={modalTurno.open}
        onClose={()=>setModalTurno(CLOSED_TURNO)}
        onSave={ta.handleSaveNewTurno} onUpdate={ta.handleUpdateTurno}
        clientes={clientes} defaultFecha={modalTurno.fecha} turnoEdit={modalTurno.turnoEdit}
      />
      <ModalNota
        open={modalNota.open} defaultTipo={modalNota.tipo} initial={modalNota.initial}
        onClose={()=>setModalNota(CLOSED_NOTA)}
        onSave={na.handleSaveNota}
      />
      <ConfirmDialog
        open={confirm.open} msg={confirm.msg}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
}
