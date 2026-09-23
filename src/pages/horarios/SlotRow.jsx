export default function SlotRow({ hora, tomado, onToggle, onRemove }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 6px',marginBottom:2,background:tomado?'#fff0f3':'#f8fffe',borderRadius:6,border:`1px solid ${tomado?'#f5c6d0':'#e8f8f0'}`}}>
      <span onClick={onToggle} title={tomado?'Marcar disponible':'Marcar tomado'} style={{fontSize:11,fontWeight:600,cursor:'pointer',textDecoration:tomado?'line-through':'none',color:tomado?'#b0a0a8':'inherit',userSelect:'none',flex:1}}>
        🕐 {hora} hs {tomado && <span style={{fontSize:10,color:'#B83D62'}}>tomado</span>}
      </span>
      <button onClick={onRemove} style={{background:'none',border:'none',color:'#B83D62',cursor:'pointer',fontSize:12,lineHeight:1,padding:0}}>✕</button>
    </div>
  );
}
