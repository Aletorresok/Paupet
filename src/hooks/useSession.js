import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Sesión de Supabase Auth. `undefined` mientras se consulta, `null` si no hay usuario.
export function useSession() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  return session;
}
