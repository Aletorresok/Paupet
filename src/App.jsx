import { useState } from 'react';
import RespProvider from './context/RespProvider';
import { SESSION_KEY } from './lib/constants';
import LoginPage from './pages/login/LoginPage';
import AppShell from './AppShell';

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <RespProvider>
      <AppShell onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }} />
    </RespProvider>
  );
}
