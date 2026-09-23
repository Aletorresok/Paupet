import { fmtFecha, fmtPeso } from '../../lib/utils';

const iconBtn = {background:'none',border:'none',cursor:'pointer',fontSize:13,padding:'2px 4px'};

export default function VisitaItem({ visita: v, onEdit, onDelete }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,background:'white',borderRadius:10,padding:'9px 12px',marginBottom:6,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
      <div style={{width:7,height:7,borderRadius:'50%',background:'#5fbf9b',flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500}}>{v.servicio} <span style={{fontSize:11,color:'#9a9090'}}>({v.forma_pago || 'efectivo'})</span></div>
        <div style={{fontSize:11,color:'#9a9090'}}>{fmtFecha(v.fecha)}</div>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:'#3a9b7b'}}>{fmtPeso(v.precio)}</div>
      {v.id && (
        <div style={{display:'flex',gap:4}}>
          <button onClick={onEdit} style={{...iconBtn,color:'#9a9090'}}>✏️</button>
          <button onClick={onDelete} style={{...iconBtn,color:'#e8809a'}}>🗑</button>
        </div>
      )}
    </div>
  );
}
