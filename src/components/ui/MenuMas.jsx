import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { C, sans } from '../../lib/styles';

// Botón "⋯" con acciones secundarias (editar, eliminar…), para que no queden al alcance de un toque sin querer.
// `acciones` = [{ label, icon, onClick, peligro }]
export default function MenuMas({ acciones, label = 'Más acciones' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const cerrar = e => { if (!ref.current?.contains(e.target)) setAbierto(false); };
    const esc = e => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', cerrar);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', cerrar); document.removeEventListener('keydown', esc); };
  }, [abierto]);

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(a => !a)}
        style={{width:44,height:44,borderRadius:12,border:`1px solid ${C.linea}`,background:'white',color:C.tinta,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="more" size={20} />
      </button>
      {abierto && (
        <div role="menu" style={{position:'absolute',right:0,top:50,zIndex:20,minWidth:180,background:'white',border:`1px solid ${C.linea}`,borderRadius:14,boxShadow:'0 10px 30px rgba(31,42,38,.14)',padding:6,display:'flex',flexDirection:'column'}}>
          {acciones.map(a => (
            <button key={a.label} type="button" role="menuitem" onClick={() => { setAbierto(false); a.onClick(); }}
              style={{display:'flex',alignItems:'center',gap:10,height:44,padding:'0 12px',border:'none',borderRadius:10,background:'transparent',fontFamily:sans,fontSize:15,textAlign:'left',cursor:'pointer',color:a.peligro ? C.rosa : C.tinta}}>
              {a.icon && <Icon name={a.icon} size={17} />}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
