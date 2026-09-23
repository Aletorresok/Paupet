import { fmtFecha, fmtPeso } from '../../lib/utils';

export default function HistorialCards({ items }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {items.map((v,i) => (
        <div key={v.id||i} style={{background:'#F7F4EF',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #5fbf9b'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div>
              <span style={{fontSize:14,fontWeight:600}}>{v.dog||'–'}</span>
              <span style={{fontSize:12,color:'#5B6661',marginLeft:8}}>{v.owner||'–'}</span>
            </div>
            <strong style={{fontSize:13,color:'#1F5A45'}}>{fmtPeso(v.precio)}</strong>
          </div>
          <div style={{fontSize:12,color:'#5B6661'}}>{v.servicio} · {fmtFecha(v.fecha)} <span style={{textTransform:'capitalize'}}>({v.forma_pago || 'efectivo'})</span></div>
        </div>
      ))}
    </div>
  );
}
