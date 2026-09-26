import { useState } from 'react';
import { useResp } from './context/resp';
import GlobalStyles from './components/layout/GlobalStyles';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import { todayStr } from './lib/utils';
import BetaBanner from './components/layout/BetaBanner';
import Esqueleto from './components/ui/Esqueleto';
import ToastContainer from './components/ui/ToastContainer';
import { useToasts } from './hooks/useToasts';
import { useConfirm } from './hooks/useConfirm';
import { usePaupetData } from './hooks/usePaupetData';
import { useModals } from './hooks/useModals';
import { useClienteActions } from './hooks/useClienteActions';
import { useTurnoActions } from './hooks/useTurnoActions';
import { useNotaActions } from './hooks/useNotaActions';
import { useConfigActions } from './hooks/useConfigActions';
import AppPages from './AppPages';
import AppModals from './AppModals';

export default function AppShell({ onLogout }) {
  const { isMob } = useResp();
  const [page, setPage] = useState('dashboard');

  const { toasts, toast } = useToasts();
  const { confirm, askConfirm, closeConfirm } = useConfirm();
  const data = usePaupetData(toast);
  const modals = useModals();

  const ctx = { ...data, toast, askConfirm, modals };
  const clienteActions = useClienteActions(ctx);
  const turnoActions   = useTurnoActions(ctx);
  const notaActions    = useNotaActions(ctx);
  const configActions  = useConfigActions(ctx);

  const pendingCount = data.turnos.filter(t=>t.estado==='pending').length;

  return (
    <>
      <GlobalStyles />

      <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <BetaBanner />
      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
        {!isMob && <Sidebar activePage={page} onNav={setPage} pendingCount={pendingCount} onLogout={onLogout}/>}

        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>

          <main style={{flex:1,overflowY:'auto',padding:isMob?'20px 16px 110px':'28px 36px',minWidth:0}}>
            {data.loading ? <Esqueleto /> : (
              <AppPages
                page={page} setPage={setPage} toast={toast}
                data={data} modals={modals}
                turnoActions={turnoActions} notaActions={notaActions} configActions={configActions}
              />
            )}
          </main>
        </div>
      </div>
      </div>

      {isMob && (
        <MobileNav
          activePage={page} onNav={setPage} pendingCount={pendingCount} onLogout={onLogout}
          onNuevoTurno={() => modals.setModalTurno({open:true, fecha:todayStr(), turnoEdit:null})}
        />
      )}

      <AppModals
        modals={modals} clientes={data.clientes} turnos={data.turnos} caps={data.caps} toast={toast}
        clienteActions={clienteActions} turnoActions={turnoActions} notaActions={notaActions}
        confirm={confirm} closeConfirm={closeConfirm}
      />
      <ToastContainer toasts={toasts}/>
    </>
  );
}
