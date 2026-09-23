import Badge from '../../components/ui/Badge';
import { C, serif } from '../../lib/styles';
import { useResp } from '../../context/resp';
import { diasDesde } from '../../lib/utils';
import PetAvatar from '../../components/ui/PetAvatar';
import { avatarPorRaza, esGato } from '../../lib/avatarPerro';
import { calcFrecuencia } from '../../lib/frecuencia';

const ellipsis = {overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'};

function ultimaVisitaBadge(visitas) {
  const ultima = visitas?.length ? [...visitas].sort((a,b) => b.fecha.localeCompare(a.fecha))[0] : null;
  const dias = ultima ? diasDesde(ultima.fecha) : null;
  const f = calcFrecuencia(visitas);
  return {
    variant: dias===null?'gray':f?(f.estado==='vencido'?'pink':f.estado==='pronto'?'orange':'green'):dias>30?'pink':'green',
    text: dias===null?'Sin visitas':dias===0?'Hoy':`Hace ${dias}d`,
  };
}

// En el celular, fila de lista (avatar · nombres · estado); en pantallas grandes, tarjeta.
function ClienteFila({ cliente: c, badge, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,width:'100%',minHeight:72,padding:'10px 14px',background:'white',border:`1px solid ${C.linea}`,borderRadius:14,cursor:'pointer',textAlign:'left',fontFamily:'inherit',color:C.tinta}}>
      <PetAvatar cliente={c} size={52} />
      <span style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:2}}>
        <span style={{fontFamily:serif,fontSize:17,fontWeight:600,...ellipsis}}>{c.dog}</span>
        <span style={{fontSize:13,color:C.tintaSuave,...ellipsis}}>{[c.owner, c.raza].filter(Boolean).join(' · ')}</span>
      </span>
      <Badge variant={badge.variant}>{badge.text}</Badge>
    </button>
  );
}

export default function ClienteCard({ cliente: c, onClick }) {
  const { isMob } = useResp();
  const badge = ultimaVisitaBadge(c.visitas);
  if (isMob) return <ClienteFila cliente={c} badge={badge} onClick={onClick} />;
  return (
    <div onClick={onClick} style={{background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'transform .15s'}}>
      <div style={{height:110,background:'linear-gradient(135deg,#dff5ec,#FBE7EC)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,overflow:'hidden'}}>
        {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={c.dog} /> : esGato(c.raza) ? <span>🐱</span> : <img src={avatarPorRaza(c.raza)} alt="" style={{height:'92%',width:'auto'}} />}
      </div>
      <div style={{padding:'11px 13px'}}>
        <div style={{fontFamily:serif,fontSize:16,fontWeight:600,...ellipsis}}>{c.dog}</div>
        <div style={{fontSize:11,color:'#5B6661',marginBottom:6,...ellipsis}}>👤 {c.owner}</div>
        {c.raza && <div style={{fontSize:11,color:'#5B6661',marginBottom:6,...ellipsis}}>🐾 {c.raza}</div>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
          <Badge variant={badge.variant}>{badge.text}</Badge>
          <span style={{fontSize:11,color:'#5B6661'}}>{(c.visitas||[]).length}v</span>
        </div>
      </div>
    </div>
  );
}
