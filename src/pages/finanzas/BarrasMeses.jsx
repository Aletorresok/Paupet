import { useState } from 'react';
import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { COL } from './colores';
import Leyenda from './Leyenda';

const ALTO = 180;
const fmtK = n => n >= 1e6 ? `$${(n/1e6).toFixed(1).replace('.', ',')}M` : n >= 1000 ? `$${Math.round(n/1000)}k` : fmtPeso(n);

// Ingresos vs gastos por mes: barras pareadas, con detalle al pasar el mouse o tocar.
export default function BarrasMeses({ serie, mesSel, onSelectMes }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...serie.flatMap(s => [s.ingresos, s.gastos]));
  const activo = serie.find(s => s.mes === hover);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <Leyenda items={[{label:'Ingresos',color:COL.ingresos},{label:'Gastos',color:COL.gastos}]} />
        <span style={{flex:1}}/>
        <span aria-live="polite" style={{fontSize:13,color:C.tinta,minHeight:18}}>
          {activo && <><strong>{activo.label}</strong> · Ingresos {fmtPeso(activo.ingresos)} · Gastos {fmtPeso(activo.gastos)} · Ganancia {fmtPeso(activo.ingresos - activo.gastos)}</>}
        </span>
      </div>
      <div style={{position:'relative',height:ALTO+24}}>
        <span style={{position:'absolute',left:0,top:-2,fontSize:11,color:C.tintaSuave}}>{fmtK(max)}</span>
        <div style={{position:'absolute',left:0,right:0,top:6,borderTop:`1px dashed ${COL.grilla}`}}/>
        <span style={{position:'absolute',left:0,top:6+(ALTO-10)/2-14,fontSize:11,color:C.tintaSuave}}>{fmtK(max/2)}</span>
        <div style={{position:'absolute',left:0,right:0,top:6+(ALTO-10)/2,borderTop:`1px dashed ${COL.grilla}`}}/>
        <div style={{position:'absolute',left:0,right:0,top:ALTO,borderTop:`1.5px solid ${C.lineaFuerte}`}}/>
        <div style={{position:'absolute',inset:0,display:'grid',gridTemplateColumns:`repeat(${serie.length},minmax(0,1fr))`}}>
          {serie.map(s => {
            const sel = s.mes === mesSel;
            return (
              <button key={s.mes} type="button" onClick={() => onSelectMes(s.mes)}
                onMouseEnter={() => setHover(s.mes)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(s.mes)} onBlur={() => setHover(null)}
                aria-label={`${s.label}: ingresos ${fmtPeso(s.ingresos)}, gastos ${fmtPeso(s.gastos)}`}
                style={{border:'none',background:hover===s.mes?'#F7F4EF':'transparent',borderRadius:10,cursor:'pointer',padding:0,display:'flex',flexDirection:'column',alignItems:'center',fontFamily:'inherit'}}>
                <div style={{height:ALTO,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',gap:2}}>
                  <div style={{width:'min(22px,30%)',height:Math.max(s.ingresos ? 2 : 0, s.ingresos / max * (ALTO - 10)),background:COL.ingresos,borderRadius:'4px 4px 0 0'}}/>
                  <div style={{width:'min(22px,30%)',height:Math.max(s.gastos ? 2 : 0, s.gastos / max * (ALTO - 10)),background:COL.gastos,borderRadius:'4px 4px 0 0'}}/>
                </div>
                <span style={{fontSize:13,marginTop:6,color:sel?C.tinta:C.tintaSuave,fontWeight:sel?700:400}}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <details style={{fontSize:13,color:C.tintaSuave}}>
        <summary style={{cursor:'pointer'}}>Ver los números</summary>
        <table style={{width:'100%',borderCollapse:'collapse',marginTop:8,color:C.tinta}}>
          <thead><tr>{['Mes','Ingresos','Gastos','Ganancia'].map(h => <th key={h} style={{textAlign:h==='Mes'?'left':'right',padding:'4px 6px',borderBottom:`1px solid ${C.linea}`,fontWeight:600}}>{h}</th>)}</tr></thead>
          <tbody>{serie.map(s => (
            <tr key={s.mes}>
              <td style={{padding:'4px 6px'}}>{s.label}</td>
              <td style={{padding:'4px 6px',textAlign:'right'}}>{fmtPeso(s.ingresos)}</td>
              <td style={{padding:'4px 6px',textAlign:'right'}}>{fmtPeso(s.gastos)}</td>
              <td style={{padding:'4px 6px',textAlign:'right'}}>{fmtPeso(s.ingresos - s.gastos)}</td>
            </tr>
          ))}</tbody>
        </table>
      </details>
    </div>
  );
}
