import Badge from '../../components/ui/Badge';
import { serif } from '../../lib/styles';
import { animalIcon } from '../../lib/utils';

const ellipsis = {overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'};

function ultimaVisitaBadge(visitas) {
  const ultima = visitas?.length ? [...visitas].sort((a,b) => b.fecha.localeCompare(a.fecha))[0] : null;
  const dias = ultima ? Math.floor((Date.now()-new Date(ultima.fecha))/86400000) : null;
  return {
    variant: dias===null?'gray':dias>30?'pink':'green',
    text: dias===null?'Sin visitas':dias===0?'Hoy':`Hace ${dias}d`,
  };
}

export default function ClienteCard({ cliente: c, onClick }) {
  const badge = ultimaVisitaBadge(c.visitas);
  return (
    <div onClick={onClick} style={{background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'transform .15s'}}>
      <div style={{height:110,background:'linear-gradient(135deg,#dff5ec,#fde8ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,overflow:'hidden'}}>
        {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={c.dog} /> : <span>{animalIcon(c.raza)}</span>}
      </div>
      <div style={{padding:'11px 13px'}}>
        <div style={{fontFamily:serif,fontSize:16,fontWeight:600,...ellipsis}}>{c.dog}</div>
        <div style={{fontSize:11,color:'#9a9090',marginBottom:6,...ellipsis}}>👤 {c.owner}</div>
        {c.raza && <div style={{fontSize:11,color:'#9a9090',marginBottom:6,...ellipsis}}>🐾 {c.raza}</div>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
          <Badge variant={badge.variant}>{badge.text}</Badge>
          <span style={{fontSize:11,color:'#9a9090'}}>{(c.visitas||[]).length}v</span>
        </div>
      </div>
    </div>
  );
}
