import Dashboard from './pages/dashboard/Dashboard';
import ClientesPage from './pages/clientes/ClientesPage';
import CalendarioPage from './pages/calendario/CalendarioPage';
import HistorialPage from './pages/historial/HistorialPage';
import NotasPage from './pages/notas/NotasPage';
import HorariosPage from './pages/horarios/HorariosPage';
import ConfigPage from './pages/config/ConfigPage';
import { todayStr } from './lib/utils';

// Renderiza la página activa.
export default function AppPages({ page, setPage, data, modals, turnoActions: ta, notaActions: na, configActions }) {
  const { clientes, turnos, notas, config } = data;
  const { setModalCliente, setModalNuevoCliente, setModalTurno, setModalNota } = modals;

  switch (page) {
    case 'dashboard':
      return <Dashboard clientes={clientes} turnos={turnos} notas={notas} onNav={setPage} onOpenClient={id=>setModalCliente({open:true,id})} onNuevoTurno={()=>setModalTurno({open:true,fecha:todayStr(),turnoEdit:null})} onCompletar={ta.handleCompletar} onNoVino={ta.handleNoVino} onEditTurno={ta.handleEditTurno}/>;
    case 'clientes':
      return <ClientesPage clientes={clientes} onOpenClient={id=>setModalCliente({open:true,id})} onNuevo={()=>setModalNuevoCliente({open:true,initial:null})}/>;
    case 'calendario':
      return <CalendarioPage clientes={clientes} turnos={turnos} onAddTurno={(fecha,hora)=>setModalTurno({open:true,fecha,hora,turnoEdit:null})} onCompletar={ta.handleCompletar} onNoVino={ta.handleNoVino} onDelete={ta.handleDeleteTurno} onConfirmar={ta.handleConfirmar} onEditTurno={ta.handleEditTurno}/>;
    case 'historial':
      return <HistorialPage clientes={clientes} turnos={turnos}/>;
    case 'notas':
      return <NotasPage notas={notas} onToggleCompra={na.handleToggleCompra} onDeleteNota={na.handleDeleteNota} onEditNota={n=>setModalNota({open:true,tipo:n.tipo,initial:n})} onAgregar={tipo=>setModalNota({open:true,tipo,initial:null})}/>;
    case 'horarios':
      return <HorariosPage horariosData={config.horariosSemanales} onSaveHorarios={configActions.handleSaveHorarios}/>;
    case 'config':
      return <ConfigPage config={config} onSave={configActions.handleSaveConfig}/>;
    default:
      return null;
  }
}
