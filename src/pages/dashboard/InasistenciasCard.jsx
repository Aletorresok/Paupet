import Badge from '../../components/ui/Badge';
import PetAvatar from '../../components/ui/PetAvatar';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';

export default function InasistenciasCard({ clientes }) {
  if (!clientes.length) return null;
  return (
    <section aria-label="Inasistencias" style={{...cardStyle,padding:'18px 20px'}}>
      <h3 style={sectionTitleStyle}>Faltaron sin avisar</h3>
      {clientes.map(c => (
        <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:'1px solid #F0EBE4'}}>
          <PetAvatar cliente={c} size={44} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:500}}>{c.dog}</div>
            <div style={{fontSize:12,color:C.tintaSuave,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.owner}</div>
          </div>
          <Badge variant="pink">{c.inasistencias} {c.inasistencias===1?'vez':'veces'}</Badge>
        </div>
      ))}
    </section>
  );
}
