import { DIAS_HOD_LABELS } from '../../lib/constants';
import { C, cardStyle, sans } from '../../lib/styles';
import Icon from '../../components/ui/Icon';
import SlotRow from './SlotRow';

const miniBtn = {height:36,borderRadius:10,cursor:'pointer',fontFamily:sans,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:4,flexShrink:0};

// Tarjeta de edición de horarios de un día de la semana.
export default function DiaSlotsCard({ dia, date, horas, tomados, agenda = {}, activo, nuevoSlot, onNuevoSlot, onToggleDia, onAgregar, onQuitar, onToggleTomado, onAutoGen }) {
  const libres = horas.filter(h => !tomados.includes(h)).length;
  return (
    <div style={{...cardStyle,padding:12,opacity:activo?1:.6,transition:'opacity .2s',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600}}>{DIAS_HOD_LABELS[dia]} {date.getDate()}</div>
          <div style={{fontSize:12,color:C.tintaSuave}}>{activo ? (horas.length ? `${libres} libre${libres===1?'':'s'} de ${horas.length}` : 'Sin horarios') : 'No trabajo'}</div>
        </div>
        <button type="button" role="switch" aria-checked={activo} onClick={onToggleDia} title={activo ? 'Marcar que no trabajo' : 'Marcar que trabajo'}
          style={{position:'relative',width:40,height:24,borderRadius:999,border:'none',cursor:'pointer',background:activo?C.menta:'#CFC8BE',flexShrink:0,padding:0}}>
          <span style={{position:'absolute',top:3,left:activo?19:3,width:18,height:18,borderRadius:'50%',background:'white',boxShadow:'0 1px 3px rgba(0,0,0,.2)',transition:'left .15s'}}/>
        </button>
      </div>
      {activo && (
        <>
          <div style={{flex:1,marginBottom:8}}>
            {horas.map(h => (
              <SlotRow key={h} hora={h} tomado={tomados.includes(h)} turnoDe={agenda[h]} onToggle={()=>onToggleTomado(h)} onRemove={()=>onQuitar(h)} />
            ))}
          </div>
          <div style={{display:'flex',gap:6}}>
            <input type="time" value={nuevoSlot} onChange={e=>onNuevoSlot(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onAgregar()} aria-label={`Nuevo horario para ${DIAS_HOD_LABELS[dia]}`}
              style={{flex:1,minWidth:0,height:36,border:`1px solid ${C.lineaFuerte}`,borderRadius:10,padding:'0 8px',fontSize:14,fontFamily:sans,outline:'none',background:'white',color:C.tinta}} />
            <button type="button" onClick={onAgregar} aria-label="Agregar horario" style={{...miniBtn,width:36,border:'none',background:C.menta,color:C.sobreMenta}}><Icon name="plus" size={16} strokeWidth={2.2}/></button>
            <button type="button" onClick={onAutoGen} title="Generar varios horarios de una vez" style={{...miniBtn,padding:'0 10px',border:`1px solid ${C.linea}`,background:'white',color:C.tinta}}>Varios</button>
          </div>
        </>
      )}
    </div>
  );
}
