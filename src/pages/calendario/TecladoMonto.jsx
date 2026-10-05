import { useEffect } from 'react';
import { C } from '../../lib/styles';
import { teclear } from './ayudaTurno';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
const tecla = {height:54,borderRadius:14,border:'none',background:'#F2F0EC',color:C.tinta,fontFamily:'inherit',fontSize:24,fontWeight:500,cursor:'pointer'};

// Monto grande + teclado numérico en pantalla. En PC también se escribe con el teclado de la compu
// (números y borrar), salvo cuando se está escribiendo en otro campo. `onChange` es un setState (acepta función).
// `ultimo`: el chip "Igual que la última vez".
export default function TecladoMonto({ monto, onChange, ultimo }) {
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const t = /^\d$/.test(e.key) ? e.key : e.key === 'Backspace' ? '⌫' : null;
      if (!t) return;
      e.preventDefault();
      onChange(m => teclear(m, t));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  const n = parseInt(monto || '0', 10);
  return (
    <>
      <div aria-live="polite" aria-label={`Monto: ${n ? `$${n.toLocaleString('es-AR')}` : 'sin escribir'}`}
        style={{height:76,borderRadius:16,border:`2px solid ${C.mentaBorde}`,display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontSize:44,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>
        <span style={{color:C.tintaSuave,fontSize:30}}>$</span>
        <span style={{color:n ? C.tinta : '#B5B0A8'}}>{n ? n.toLocaleString('es-AR') : '0'}</span>
        <span aria-hidden="true" style={{width:2,height:40,background:C.mentaBorde}} />
      </div>
      {ultimo}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>
        {TECLAS.map(t => (
          <button key={t} type="button" aria-label={t === '⌫' ? 'Borrar' : t === '000' ? 'Tres ceros' : t}
            onClick={() => onChange(m => teclear(m, t))} style={tecla}>{t}</button>
        ))}
      </div>
    </>
  );
}
