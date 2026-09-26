import { useMemo, useState } from 'react';
import { buscarDuenos, listaDuenos } from '../../lib/duenos';
import { C, inputStyle } from '../../lib/styles';
import Icon from './Icon';

// Buscador de un dueño que ya es cliente. Al elegirlo llama a `onElegir({owner, tel})`.
// `elegido` = {owner, tel} para mostrarlo seleccionado (con opción de cambiarlo).
export default function DuenoPicker({ clientes, elegido, onElegir, onLimpiar }) {
  const [q, setQ] = useState('');
  const duenos = useMemo(() => listaDuenos(clientes), [clientes]);
  const resultados = buscarDuenos(duenos, q);

  if (elegido) {
    const d = duenos.find(x => x.owner === elegido.owner) || { perros: [] };
    return (
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:'white',border:`1.5px solid ${C.mentaBorde}`}}>
        <Icon name="users" />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600}}>{elegido.owner}{elegido.tel && <span style={{fontWeight:400,color:C.tintaSuave}}> · {elegido.tel}</span>}</div>
          {d.perros.length > 0 && <div style={{fontSize:13,color:C.tintaSuave}}>Ya trae a {d.perros.join(', ')}</div>}
        </div>
        <button type="button" onClick={onLimpiar} style={{border:'none',background:'none',color:C.verde,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer'}}>Cambiar</button>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <input type="search" value={q} onChange={e => setQ(e.target.value)} autoFocus
        placeholder="Buscar por dueño, teléfono o uno de sus perros…" aria-label="Buscar dueño" style={inputStyle} />
      {q.trim() && !resultados.length && <div style={{fontSize:13,color:C.tintaSuave,padding:'2px 4px'}}>No hay dueños con «{q.trim()}». Cargalo como dueño nuevo.</div>}
      {resultados.map(d => (
        <button key={`${d.owner}|${d.tel}`} type="button" onClick={() => { onElegir({ owner: d.owner, tel: d.tel }); setQ(''); }}
          style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2,padding:'8px 12px',borderRadius:10,border:`1px solid ${C.linea}`,background:'white',fontFamily:'inherit',cursor:'pointer',textAlign:'left',color:C.tinta}}>
          <span style={{fontSize:15,fontWeight:600}}>{d.owner}{d.tel && <span style={{fontWeight:400,color:C.tintaSuave}}> · {d.tel}</span>}</span>
          <span style={{fontSize:13,color:C.tintaSuave}}>{d.perros.length === 1 ? 'Perro' : 'Perros'}: {d.perros.join(', ')}</span>
        </button>
      ))}
    </div>
  );
}
