import Toggle from './Toggle';
import SlotChip from './SlotChip';
import NuevoSlotForm from './NuevoSlotForm';

export default function DiaConfigCard({ dia, slots, isOpen, onToggleOpen, isExp, onToggleExp, newHora, newDur, onNewHora, onNewDur, onAddSlot, onRemoveSlot }) {
  return (
    <div style={{background:'white',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:12,overflow:'hidden'}}>
      <div onClick={onToggleExp} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',cursor:'pointer',borderBottom:isExp?'1.5px solid #E6E0D8':'1.5px solid transparent'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Toggle on={isOpen} onChange={onToggleOpen} label={`${dia.label} abierto`} />
          <span style={{fontSize:14,fontWeight:600}}>{dia.label}</span>
          <span style={{fontSize:11,color:'#5B6661'}}>{slots.length} turno{slots.length!==1?'s':''}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:'#5B6661'}}>{isOpen?'Abierto':'Cerrado'}</span>
          <span style={{color:'#5B6661',fontSize:14}}>{isExp?'▲':'▼'}</span>
        </div>
      </div>
      {isExp && <div style={{padding:'14px 18px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8,marginBottom:10}}>
          {!slots.length ? <div style={{fontSize:13,color:'#5B6661'}}>Sin turnos cargados</div>
            : slots.map(s => <SlotChip key={s.hora} slot={s} onRemove={()=>onRemoveSlot(s.hora)} />)
          }
        </div>
        <NuevoSlotForm hora={newHora} dur={newDur} onHora={onNewHora} onDur={onNewDur} onAdd={onAddSlot} />
      </div>}
    </div>
  );
}
