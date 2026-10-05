import { C } from '../../lib/styles';
import Icon from '../../components/ui/Icon';

// Con `onClick` la tarjeta se puede tocar para ver de qué está hecho el número.
export default function KpiCard({ label, valor, detalle, tono, oscuro, onClick }) {
  const suave = oscuro ? '#CFE3DA' : C.tintaSuave;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} aria-label={onClick ? `${label}: ${valor}. Ver el detalle` : undefined}
      style={{background:oscuro?C.verdeProfundo:'white',color:oscuro?'white':C.tinta,border:oscuro?'none':`1px solid ${C.linea}`,borderRadius:16,padding:'16px 18px',display:'flex',flexDirection:'column',gap:4,minWidth:0,textAlign:'left',font:'inherit',cursor:onClick?'pointer':undefined}}>
      <span style={{fontSize:13,color:suave,display:'flex',alignItems:'center',gap:4}}>
        <span style={{flex:1}}>{label}</span>
        {onClick && <Icon name="right" size={16} strokeWidth={2} />}
      </span>
      <span style={{fontSize:28,fontWeight:600,letterSpacing:'-.02em',lineHeight:1.15}}>{valor}</span>
      {detalle && <span style={{fontSize:13,color:tono || suave,fontWeight:tono?500:400}}>{detalle}</span>}
    </Tag>
  );
}
