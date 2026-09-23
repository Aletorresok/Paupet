import RespProvider from './context/RespProvider';
import { supabase } from './lib/supabase';
import { useSession } from './hooks/useSession';
import { RUTA_TURNOS } from './lib/constants';
import LoginPage from './pages/login/LoginPage';
import PedirTurnoPage from './pages/turnos/PedirTurnoPage';
import AppShell from './AppShell';

const esPaginaTurnos = () => window.location.pathname.replace(/\/+$/, '') === RUTA_TURNOS;

function AppPrivada() {
  const session = useSession();

  if (session === undefined) return null;
  return (
    <RespProvider>
      {session ? <AppShell onLogout={() => supabase.auth.signOut()} /> : <LoginPage />}
    </RespProvider>
  );
}

// /turnos es pública (los clientes piden turno); todo lo demás pide usuario.
export default function App() {
  return esPaginaTurnos() ? <PedirTurnoPage /> : <AppPrivada />;
}
