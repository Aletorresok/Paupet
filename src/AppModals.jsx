import ConfirmDialog from './components/ui/ConfirmDialog';
import ModalCliente from './pages/clientes/ModalCliente';
import ModalClienteForm from './pages/clientes/ModalClienteForm';
import ModalTurno from './pages/calendario/ModalTurno';
import ModalCobro from './pages/calendario/ModalCobro';
import ModalNota from './pages/notas/ModalNota';
import ModalProponer from './pages/dashboard/ModalProponer';
import ModalSena from './pages/clientes/ModalSena';
import { CLOSED_TURNO, CLOSED_NOTA, CLOSED_COBRO, CLOSED_SENA } from './hooks/useModals';

export default function AppModals({ modals, clientes, turnos, caps, toast, clienteActions: ca, turnoActions: ta, notaActions: na, pedidoActions: pa, pedidos = [], config, confirm, closeConfirm }) {
  const { modalCliente, setModalCliente, modalNuevoCliente, setModalNuevoCliente, modalTurno, setModalTurno, modalNota, setModalNota, modalCobro, setModalCobro, modalSena, setModalSena } = modals;
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
        onPausarVuelta={ca.handlePausarVuelta}
        onClose={()=>setModalCliente({open:false,id:null})}
        onSaveVisit={ca.handleSaveVisit}
        onEditVisit={ca.handleEditVisit}
        onDeleteVisit={ca.handleDeleteVisit}
        onDelete={ca.handleDeleteClient}
        onEdit={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:c});}}
        onAgregarPerro={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:null,preset:{owner:c.owner,tel:c.tel||''}});}}
        onDecrementarInasistencia={ca.handleDecrementarInasistencia}
        onCargarSena={id=>setModalSena({open:true,clienteId:id,turnoId:null})}
        onDevolverSaldo={ca.handleDevolverSaldo}
        onBorrarMovimiento={ca.handleBorrarMovimiento}
      />
      {modalNuevoCliente.open && <ModalClienteForm
        key={modalNuevoCliente.initial?.id ?? `nuevo${modalNuevoCliente.preset?.owner || ''}`}
        open={modalNuevoCliente.open} initial={modalNuevoCliente.initial} preset={modalNuevoCliente.preset} clientes={clientes}
        onClose={()=>setModalNuevoCliente({open:false,initial:null})}
        onSave={ca.handleSaveNewClient}
      />}
      {modalTurno.open && <ModalTurno
        key={modalTurno.turnoEdit ? `e${modalTurno.turnoEdit.id}` : `n${modalTurno.fecha}|${modalTurno.hora}|${modalTurno.clientId}|${modalTurno.servicio}|${modalTurno.pedidoId}|${modalTurno.calendarTurno?.id}`}
        open={modalTurno.open}
        onClose={()=>setModalTurno(CLOSED_TURNO)}
        onSave={ta.handleSaveNewTurno} onUpdate={ta.handleUpdateTurno}
        clientes={clientes} turnos={turnos} config={config} defaultFecha={modalTurno.fecha} defaultHora={modalTurno.hora} defaultClientId={modalTurno.clientId}
        defaultServicio={modalTurno.servicio} defaultDuracion={modalTurno.duracion} turnoEdit={modalTurno.turnoEdit}
        defaultNuevo={modalTurno.nuevo} pedidoId={modalTurno.pedidoId} calendarTurno={modalTurno.calendarTurno}
      />}
      {modalNota.open && <ModalNota
        key={modalNota.initial?.id ?? `n${modalNota.tipo}`}
        open={modalNota.open} defaultTipo={modalNota.tipo} initial={modalNota.initial}
        onClose={()=>setModalNota(CLOSED_NOTA)}
        onSave={na.handleSaveNota}
      />}
      {turnoCobro && (
        <ModalCobro
          key={turnoCobro.id}
          turno={turnoCobro}
          cliente={clientes.find(c => c.id === turnoCobro.clientId) || {}}
          tieneProximo={turnos.some(x => x.id !== turnoCobro.id && x.clientId === turnoCobro.clientId && x.estado !== 'completed' && x.fecha >= turnoCobro.fecha)}
          onClose={()=>setModalCobro(CLOSED_COBRO)}
          turnos={turnos}
          onCobrar={ta.handleCobrar}
          onDeshacer={ta.handleDeshacerCobro}
          onAgendar={ta.handleAgendarProximo}
          onNoVino={ta.handleNoVino}
        />
      )}
      {modalSena.open && clientes.some(c => c.id === modalSena.clienteId) && (
        <ModalSena key={`${modalSena.clienteId}|${modalSena.turnoId}`} cliente={clientes.find(c => c.id === modalSena.clienteId)}
          turno={turnos.find(t => t.id === modalSena.turnoId)} onClose={()=>setModalSena(CLOSED_SENA)} onGuardar={ca.handleCargarSena} />
      )}
      {modals.modalProponer.open && (
        <ModalProponer pedido={modals.modalProponer.pedido} config={config} turnos={turnos} pedidos={pedidos}
          onClose={() => modals.setModalProponer({open:false,pedido:null})} onEnviar={pa.enviarPropuesta} />
      )}
      <ConfirmDialog
        open={confirm.open} msg={confirm.msg}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
}
