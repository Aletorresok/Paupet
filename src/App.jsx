import RespProvider from './context/RespProvider';
import { supabase } from './lib/supabase';
import { useSession } from './hooks/useSession';
import LoginPage from './pages/login/LoginPage';
import AppShell from './AppShell';

export default function App() {
  const session = useSession();

  if (session === undefined) return null;
  return (
    <RespProvider>
      {session ? <AppShell onLogout={() => supabase.auth.signOut()} /> : <LoginPage />}
    </RespProvider>
  );
}
