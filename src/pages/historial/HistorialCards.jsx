import { C, serif } from '../../lib/styles';
import { fmtFecha, fmtPeso } from '../../lib/utils';

const ellipsis = {overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'};

// Historial en el celular: perro y servicio a la izquierda, precio y fecha a la derecha.
export default function HistorialCards({ items }) {
  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      {items.map((v,i) => (
        <div key={v.id||i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 2px',minHeight:64,boxSizing:'border-box',borderTop:i?`1px solid ${C.linea}`:'none'}}>
          <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:2}}>
            <span style={{fontFamily:serif,fontSize:16,fontWeight:600,...ellipsis}}>{v.dog||'–'}</span>
            <span style={{fontSize:13,color:C.tintaSuave,...ellipsis}}>{v.owner||'–'}</span>
            <span style={{fontSize:13,color:C.tinta,...ellipsis}}>{v.servicio || '–'}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
            <strong style={{fontSize:16,color:C.tinta}}>{fmtPeso(v.precio)}</strong>
            <span style={{fontSize:12,color:C.tintaSuave}}>{fmtFecha(v.fecha).replace(/ de \d{4}$/, '').replace(/ \d{4}$/, '')}</span>
            <span style={{fontSize:12,color:C.tintaSuave,textTransform:'capitalize'}}>{v.forma_pago || 'efectivo'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
