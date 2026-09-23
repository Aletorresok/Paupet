import Btn from '../../components/ui/Btn';

export default function CompraItem({ nota: n, onToggle, onEdit, onDelete }) {
  return (
    <div style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:10,padding:'13px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:n.completada?.7:1}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:3,textDecoration:n.completada?'line-through':''}}>{n.item}</div>
        <div style={{fontSize:12,color:'#9a9090'}}>Cant: {n.cantidad}{n.precio?` · $${n.precio}`:''}{n.notas?` · ${n.notas}`:''}</div>
      </div>
      <div style={{display:'flex',gap:5,flexShrink:0}}>
        <Btn size="sm" onClick={onToggle}>{n.completada?'✓':'Marcar'}</Btn>
        <Btn size="sm" variant="ghost" onClick={onEdit}>✏️</Btn>
        <Btn size="sm" variant="danger" onClick={onDelete}>🗑️</Btn>
      </div>
    </div>
  );
}
