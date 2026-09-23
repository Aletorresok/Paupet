import { DIAS_HOD_LABELS } from '../../lib/constants';
import { sans } from '../../lib/styles';
import SlotRow from './SlotRow';

const smallBtn = {border:'none',borderRadius:6,width:26,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'};

// Tarjeta de edición de horarios de un día de la semana.
export default function DiaSlotsCard({ dia, date, horas, tomados, activo, nuevoSlot, onNuevoSlot, onToggleDia, onAgregar, onQuitar, onToggleTomado, onAutoGen }) {
  return (
    <div style={{background:'white',borderRadius:12,padding:'12px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:activo?1:0.45,transition:'opacity .2s'}}>
      <div style={{background:activo?'linear-gradient(135deg,#dff5ec,#c8eed9)':'#f0f0f0',borderRadius:8,padding:'6px 10px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontWeight:700,fontSize:12,color:activo?'#1a1a1a':'#9a9090'}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {date.getDate()}</span>
        <button onClick={onToggleDia} style={{background:activo?'rgba(255,255,255,0.8)':'#e8809a',border:'none',borderRadius:20,padding:'2px 7px',fontSize:10,fontWeight:600,cursor:'pointer',color:activo?'#4caf8e':'white'}}>
          {activo ? `${horas.length}✓` : '✕'}
        </button>
      </div>
      {activo ? (
        <>
          <div style={{minHeight:40,marginBottom:6}}>
            {horas.length === 0
              ? <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'4px 0'}}>Sin horarios</p>
              : horas.map(h => (
                <SlotRow key={h} hora={h} tomado={tomados.includes(h)} onToggle={()=>onToggleTomado(h)} onRemove={()=>onQuitar(h)} />
              ))
            }
          </div>
          <div style={{display:'flex',gap:4}}>
            <input type="time" value={nuevoSlot} onChange={e=>onNuevoSlot(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onAgregar()}
              style={{flex:1,border:'1.5px solid #ede8e8',borderRadius:6,padding:'4px 7px',fontSize:11,fontFamily:sans,outline:'none'}}
            />
            <button onClick={onAgregar} style={{...smallBtn,background:'#4caf8e',color:'white',fontSize:14}}>+</button>
            <button onClick={onAutoGen} title="Auto-generar horarios" style={{...smallBtn,background:'#fff3e0',border:'1px solid #ffd599',color:'#e6860a',fontSize:12}}>⚡</button>
          </div>
        </>
      ) : (
        <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'6px 0'}}>No trabajo</p>
      )}
    </div>
  );
}
