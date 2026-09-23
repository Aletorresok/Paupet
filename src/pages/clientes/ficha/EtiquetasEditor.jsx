import { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { C, sans } from '../../../lib/styles';
import { SUGERENCIAS, colorEtiqueta } from './etiquetas';

// Etiquetas del perro: se agregan escribiendo o tocando una sugerencia, y se quitan con la ✕.
export default function EtiquetasEditor({ etiquetas, habilitado, onChange }) {
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState(false);

  const agregar = t => {
    const v = t.trim();
    if (!v || etiquetas.some(e => e.toLowerCase() === v.toLowerCase())) return;
    onChange([...etiquetas, v]);
    setTexto('');
  };

  if (!habilitado) {
    return <p style={{fontSize:13,color:C.tintaSuave}}>Las etiquetas se activan cuando se actualice la base de datos (migración 2).</p>;
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {!etiquetas.length && !editando && <span style={{fontSize:13,color:C.tintaSuave}}>Sin etiquetas todavía.</span>}
        {etiquetas.map(e => {
          const col = colorEtiqueta(e);
          return (
            <span key={e} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:13,fontWeight:600,background:col.bg,color:col.fg,borderRadius:999,padding:'4px 6px 4px 12px'}}>
              {e}
              <button type="button" aria-label={`Quitar ${e}`} onClick={() => onChange(etiquetas.filter(x => x !== e))} style={{border:'none',background:'transparent',color:'inherit',cursor:'pointer',display:'flex',padding:2,borderRadius:999}}>
                <Icon name="x" size={14} strokeWidth={2.2}/>
              </button>
            </span>
          );
        })}
        {!editando && (
          <button type="button" onClick={() => setEditando(true)} style={{fontFamily:sans,fontSize:13,border:'1px dashed #B9C2BE',background:'transparent',borderRadius:999,padding:'4px 12px',color:C.verde,cursor:'pointer'}}>+ Etiqueta</button>
        )}
      </div>
      {editando && (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',gap:8}}>
            <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregar(texto)}
              placeholder="Ej: Miedo al secador" aria-label="Nueva etiqueta"
              style={{flex:1,height:40,borderRadius:10,border:`1px solid ${C.lineaFuerte}`,padding:'0 12px',fontFamily:sans,fontSize:14}} />
            <button type="button" onClick={() => agregar(texto)} style={{height:40,padding:'0 14px',borderRadius:10,border:'none',background:C.menta,color:C.sobreMenta,fontFamily:sans,fontWeight:600,cursor:'pointer'}}>Agregar</button>
            <button type="button" onClick={() => { setEditando(false); setTexto(''); }} style={{height:40,padding:'0 12px',borderRadius:10,border:`1px solid ${C.linea}`,background:'white',fontFamily:sans,cursor:'pointer'}}>Listo</button>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {SUGERENCIAS.filter(s => !etiquetas.includes(s)).map(s => (
              <button key={s} type="button" onClick={() => s.endsWith(': ') ? setTexto(s) : agregar(s)} style={{fontFamily:sans,fontSize:12,border:`1px solid ${C.linea}`,background:'white',borderRadius:999,padding:'4px 10px',cursor:'pointer',color:C.tinta}}>{s.trim()}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
