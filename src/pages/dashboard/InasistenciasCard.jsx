import Badge from '../../components/ui/Badge';
import PetAvatar from '../../components/ui/PetAvatar';
import { cardStyle, sectionTitleStyle } from '../../lib/styles';

export default function InasistenciasCard({ clientes }) {
  return (
    <div style={{...cardStyle,padding:'18px 20px'}}>
      <div style={sectionTitleStyle}>Clientes con inasistencias</div>
      {!clientes.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Todos vinieron 👍</p>
        : clientes.map(c => (
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #dff5ec'}}>
            <PetAvatar cliente={c} />
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{c.dog}</div>
              <div style={{fontSize:11,color:'#9a9090',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.owner}</div>
            </div>
            <Badge variant="orange">{c.inasistencias}</Badge>
          </div>
        ))
      }
    </div>
  );
}
