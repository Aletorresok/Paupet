import { useState } from 'react';
import SearchInput from '../../components/ui/SearchInput';
import { cardStyle, emptyTextStyle } from '../../lib/styles';
import CompraItem from './CompraItem';

export default function ComprasTab({ notas, onToggleCompra, onEditNota, onDeleteNota }) {
  const [q, setQ] = useState('');
  const compras = notas.filter(n=>n.tipo==='compra'&&(!q||n.item.toLowerCase().includes(q.toLowerCase())));
  return (
    <div style={{...cardStyle,padding:'18px 20px'}}>
      <div style={{marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar item..." />
        <span style={{fontSize:13,color:'#9a9090',whiteSpace:'nowrap'}}>{compras.length} item{compras.length!==1?'s':''}</span>
      </div>
      {!compras.length ? <div style={emptyTextStyle}>No hay items pendientes 🎉</div>
        : <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {compras.map(n=>(
            <CompraItem key={n.id} nota={n} onToggle={()=>onToggleCompra(n.id)} onEdit={()=>onEditNota(n)} onDelete={()=>onDeleteNota(n.id)} />
          ))}
        </div>
      }
    </div>
  );
}
