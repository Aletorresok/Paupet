import Icon from '../../components/ui/Icon';
import { useResp } from '../../context/resp';
import { C, serif } from '../../lib/styles';
import PetAvatar from '../../components/ui/PetAvatar';
import { abrirWhatsApp } from '../../lib/whatsapp';

const btnClaro = {display:'flex',alignItems:'center',justifyContent:'center',gap:8,height:46,padding:'0 18px',borderRadius:12,border:'none',background:'white',color:C.verdeProfundo,fontFamily:'inherit',fontSize:15,fontWeight:600,cursor:'pointer'};
const btnBorde = {display:'flex',alignItems:'center',justifyContent:'center',gap:6,height:46,padding:'0 14px',borderRadius:12,border:'1px solid #4E6B60',background:'transparent',color:'white',fontFamily:'inherit',fontSize:14,cursor:'pointer',flex:1,minWidth:0,whiteSpace:'nowrap'};

// Tarjeta destacada con el próximo turno del día y sus acciones principales.
export default function ProximoTurnoCard({ proximo, cliente: c, onCompletar, onNoVino, onEditTurno }) {
  const { isMob } = useResp();
  if (!proximo) {
    return (
      <section aria-label="Próximo turno" style={{background:C.mentaSuave,color:'#173F31',borderRadius:20,padding:'22px 24px',display:'flex',alignItems:'center',gap:14}}>
        <Icon name="check" size={26} strokeWidth={2} />
        <span style={{fontSize:16,fontWeight:500}}>No quedan turnos por hoy.</span>
      </section>
    );
  }
  const { turno: t, etiqueta } = proximo;
  return (
    <section aria-label="Próximo turno" style={{background:C.verdeProfundo,color:'white',borderRadius:20,padding:isMob?18:'22px 24px',display:'flex',flexDirection:isMob?'column':'row',flexWrap:'wrap',gap:isMob?14:20,alignItems:isMob?'stretch':'center'}}>
      <div style={{display:'flex',gap:16,alignItems:'center',flex:'1 1 280px',minWidth:0}}>
        <PetAvatar cliente={c} size={isMob?56:80} style={{border:'3px solid rgba(255,255,255,.85)'}} />
        <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:0}}>
          <span style={{fontSize:12,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'#A9D8C3'}}>{etiqueta}</span>
          <span style={{fontFamily:serif,fontSize:isMob?22:26,fontWeight:600,lineHeight:1.15}}>
            {t.dogName || c.dog} {c.raza && <span style={{fontFamily:'inherit',fontSize:15,fontWeight:400,color:'#CFE3DA'}}>· {c.raza}{c.size ? ` ${c.size.toLowerCase()}` : ''}</span>}
          </span>
          <span style={{fontSize:15,color:'#E6F0EB'}}>{t.hora} · {t.servicio}{c.owner ? ` · ${c.owner}` : ''}</span>
          {c.notes && <span style={{alignSelf:'flex-start',marginTop:4,fontSize:12,fontWeight:600,background:C.ambarSuave,color:C.ambar,borderRadius:999,padding:'3px 10px',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.notes}</span>}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8,flex:isMob?'none':'1 0 220px',maxWidth:isMob?'none':320}}>
        <button type="button" onClick={()=>onCompletar(t.id)} style={btnClaro}><Icon name="check" strokeWidth={2}/>Completar y cobrar</button>
        <div style={{display:'flex',gap:8}}>
          {c.tel && <button type="button" onClick={()=>abrirWhatsApp(c.tel, t.dogName||c.dog, c.owner, t)} style={btnBorde}><Icon name="chat"/>Avisar</button>}
          <button type="button" onClick={()=>onEditTurno(t)} style={{...btnBorde,flex:'0 0 46px',padding:0}} aria-label="Editar turno"><Icon name="edit"/></button>
          <button type="button" onClick={()=>onNoVino(t.id)} style={btnBorde}>No vino</button>
        </div>
      </div>
    </section>
  );
}
