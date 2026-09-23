import { useState, useEffect } from 'react';
import { RespCtx } from './resp';

export default function RespProvider({ children }) {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return (
    <RespCtx.Provider value={{ w, isMob: w < 768, isTab: w >= 768 && w < 1024 }}>
      {children}
    </RespCtx.Provider>
  );
}
