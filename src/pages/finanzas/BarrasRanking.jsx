import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';

// Ranking horizontal de una sola serie (servicios más vendidos, gastos por categoría).
export default function BarrasRanking({ items, color, vacio }) {
  if (!items.length) return <p style={{fontSize:14,color:C.tintaSuave}}>{vacio}</p>;
  const max = Math.max(...items.map(i => i.monto), 1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {items.map(i => (
        <div key={i.nombre} title={`${i.nombre}: ${fmtPeso(i.monto)}`} style={{display:'flex',flexDirection:'column',gap:5}}>
          <div style={{display:'flex',fontSize:14,gap:8}}>
            <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.nombre}{i.detalle && <span style={{color:C.tintaSuave}}> · {i.detalle}</span>}</span>
            <strong>{fmtPeso(i.monto)}</strong>
          </div>
          <div style={{height:8,background:'#F0EBE4',borderRadius:4}}>
            <div style={{height:8,width:`${Math.max(2, i.monto/max*100)}%`,background:color,borderRadius:4}}/>
          </div>
        </div>
      ))}
    </div>
  );
}
