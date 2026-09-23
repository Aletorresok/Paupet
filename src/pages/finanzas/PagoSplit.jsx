import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { COL } from './colores';

// Efectivo vs transferencia del mes, como una barra partida con los valores escritos.
export default function PagoSplit({ efectivo, transferencia }) {
  const total = efectivo + transferencia;
  if (!total) return <p style={{fontSize:14,color:C.tintaSuave}}>Todavía no hay cobros este mes.</p>;
  const partes = [
    { label:'Efectivo', monto:efectivo, color:COL.efectivo },
    { label:'Transferencia', monto:transferencia, color:COL.transferencia },
  ].filter(p => p.monto > 0);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',height:18,gap:2}}>
        {partes.map((p, i) => (
          <div key={p.label} title={`${p.label}: ${fmtPeso(p.monto)} (${Math.round(p.monto/total*100)}%)`}
            style={{flex:p.monto,background:p.color,borderRadius:i===0?(partes.length>1?'4px 0 0 4px':4):'0 4px 4px 0'}}/>
        ))}
      </div>
      <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
        {partes.map(p => (
          <div key={p.label} style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:10,height:10,borderRadius:3,background:p.color}}/>
            <span style={{fontSize:14}}><strong>{p.label}</strong> {fmtPeso(p.monto)} · {Math.round(p.monto/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
