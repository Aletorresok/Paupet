import { C } from '../../lib/styles';

export default function KpiCard({ label, valor, detalle, tono, oscuro }) {
  return (
    <div style={{background:oscuro?C.verdeProfundo:'white',color:oscuro?'white':C.tinta,border:oscuro?'none':`1px solid ${C.linea}`,borderRadius:16,padding:'16px 18px',display:'flex',flexDirection:'column',gap:4,minWidth:0}}>
      <span style={{fontSize:13,color:oscuro?'#CFE3DA':C.tintaSuave}}>{label}</span>
      <span style={{fontSize:28,fontWeight:600,letterSpacing:'-.02em',lineHeight:1.15}}>{valor}</span>
      {detalle && <span style={{fontSize:13,color:tono || (oscuro?'#CFE3DA':C.tintaSuave),fontWeight:tono?500:400}}>{detalle}</span>}
    </div>
  );
}
