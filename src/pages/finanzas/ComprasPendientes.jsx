import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';

// Lo que falta comprar (items de "A comprar" sin tachar).
export default function ComprasPendientes({ notas, onVerNotas }) {
  const pendientes = notas.filter(n => n.tipo === 'compra' && !n.completada);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {!pendientes.length ? <p style={{fontSize:14,color:C.tintaSuave}}>No falta comprar nada.</p>
        : pendientes.slice(0, 6).map(n => (
          <div key={n.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:'1px solid #F0EBE4',fontSize:14}}>
            <span style={{flex:1}}>{n.item}</span>
            <span style={{color:C.tintaSuave}}>x{n.cantidad || 1}</span>
          </div>
        ))}
      <button type="button" onClick={onVerNotas} style={{alignSelf:'flex-start',marginTop:6,display:'flex',alignItems:'center',gap:4,border:'none',background:'none',color:C.verde,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer',padding:0}}>
        Ir a la lista de compras <Icon name="right" size={16}/>
      </button>
    </div>
  );
}
