import RespProvider from './context/RespProvider';
import { supabase } from './lib/supabase';
import { useSession } from './hooks/useSession';
import LoginPage from './pages/login/LoginPage';
import AppShell from './AppShell';

export default function App() {
  const session = useSession();

  if (session === undefined) return null;
  if (!session) return <LoginPage />;

  return (
    <RespProvider>
      <AppShell onLogout={() => supabase.auth.signOut()} />
    </RespProvider>
  );
}
