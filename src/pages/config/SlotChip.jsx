import { durLabel } from '../../lib/utils';

export default function SlotChip({ slot, onRemove }) {
  return (
    <div style={{background:'#dff5ec',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1.5px solid #a8dfc8'}}>
      <div>
        <span style={{fontSize:12,fontWeight:500,color:'#1F5A45'}}>🕐 {slot.hora}</span>
        <span style={{fontSize:10,color:'#5B6661',display:'block'}}>{durLabel(slot.duracion)}</span>
      </div>
      <button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:'#5B6661',fontSize:13}}>✕</button>
    </div>
  );
}
