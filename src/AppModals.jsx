import ConfirmDialog from './components/ui/ConfirmDialog';
import ModalCliente from './pages/clientes/ModalCliente';
import ModalClienteForm from './pages/clientes/ModalClienteForm';
import ModalTurno from './pages/calendario/ModalTurno';
import ModalCobro from './pages/calendario/ModalCobro';
import ModalNota from './pages/notas/ModalNota';
import { CLOSED_TURNO, CLOSED_NOTA, CLOSED_COBRO } from './hooks/useModals';

export default function AppModals({ modals, clientes, turnos, caps, toast, clienteActions: ca, turnoActions: ta, notaActions: na, confirm, closeConfirm }) {
  const { modalCliente, setModalCliente, modalNuevoCliente, setModalNuevoCliente, modalTurno, setModalTurno, modalNota, setModalNota, modalCobro, setModalCobro } = modals;
  const turnoCobro = modalCobro.open ? turnos.find(t => t.id === modalCobro.turnoId) : null;
  const activeCliente = clientes.find(c=>c.id===modalCliente.id);

  return (
    <>
      <ModalCliente
        open={modalCliente.open} cliente={activeCliente}
        clientes={clientes} turnos={turnos} caps={caps} toast={toast}
        onSelectCliente={id=>setModalCliente({open:true,id})}
        onDarTurno={(clientId, fecha)=>{setModalCliente({open:false,id:null});setModalTurno({open:true,fecha,clientId,turnoEdit:null});}}
        onSaveEtiquetas={ca.handleSaveEtiquetas}
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
        clientes={clientes} turnos={turnos} defaultFecha={modalTurno.fecha} defaultHora={modalTurno.hora} defaultClientId={modalTurno.clientId}
        defaultServicio={modalTurno.servicio} defaultDuracion={modalTurno.duracion} turnoEdit={modalTurno.turnoEdit}
      />
      <ModalNota
        open={modalNota.open} defaultTipo={modalNota.tipo} initial={modalNota.initial}
        onClose={()=>setModalNota(CLOSED_NOTA)}
        onSave={na.handleSaveNota}
      />
      {turnoCobro && (
        <ModalCobro
          key={turnoCobro.id}
          turno={turnoCobro}
          cliente={clientes.find(c => c.id === turnoCobro.clientId) || {}}
          tieneProximo={turnos.some(x => x.id !== turnoCobro.id && x.clientId === turnoCobro.clientId && x.estado !== 'completed' && x.fecha >= turnoCobro.fecha)}
          onClose={()=>setModalCobro(CLOSED_COBRO)}
          onCobrar={ta.handleCobrar}
          onNoVino={ta.handleNoVino}
        />
      )}
      <ConfirmDialog
        open={confirm.open} msg={confirm.msg}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
}
