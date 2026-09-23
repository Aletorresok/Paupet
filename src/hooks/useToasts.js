import { useState, useCallback } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, error=false) => {
    const id = Date.now();
    setToasts(ts => [...ts,{id,msg,error}]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)), 3500);
  }, []);
  return { toasts, toast };
}
