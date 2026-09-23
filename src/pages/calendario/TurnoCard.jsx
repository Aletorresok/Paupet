import Icon from '../../components/ui/Icon';
import Btn from '../../components/ui/Btn';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { fmtPeso } from '../../lib/utils';
import { abrirWhatsApp } from '../../lib/whatsapp';

const borderColor = e => e==='pending'?'#B83D62':e==='completed'?'#5B6661':'#5fbf9b';

export default function TurnoCard({ turno: t, cliente: c, onConfirmar, onCompletar, onNoVino, onEditTurno, onDelete }) {
  const completed = t.estado==='completed';
  return (
    <div style={{background:'#F7F4EF',borderRadius:10,padding:'10px 12px',marginBottom:8,borderLeft:`3px solid ${borderColor(t.estado)}`,opacity:completed?.75:1}}>
      <div style={{fontSize:11,color:'#5B6661',fontWeight:600,textTransform:'uppercase'}}>{t.hora}</div>
      <div style={{fontSize:14,fontWeight:500}}>{t.dogName||c.dog}</div>
      <div style={{fontSize:12,color:'#5B6661'}}>{t.servicio} · {fmtPeso(t.precio)} {t.forma_pago ? `(${t.forma_pago})` : ''}</div>
      <div style={{display:'flex',gap:4,marginTop:7,flexWrap:'wrap'}}>
        {t.estado==='pending' && <Btn size="xs" variant="ghost" onClick={()=>onConfirmar(t.id)}><Icon name="check" size={16}/>Confirmar</Btn>}
        {!completed && <Btn size="xs" onClick={()=>onCompletar(t.id)}>Completar y cobrar</Btn>}
        {!completed && <Btn size="xs" variant="danger" onClick={()=>onNoVino(t.id)}>No vino</Btn>}
        {completed && <span style={{fontSize:12,color:'#1F5A45',padding:'3px 10px',background:'#DFF5EC',borderRadius:20,fontWeight:600}}>✓ Completado</span>}
        {c.tel && <WhatsAppBtn onClick={()=>abrirWhatsApp(c.tel,t.dogName||c.dog,c.owner,t)} />}
        <Btn size="xs" variant="ghost" onClick={()=>onEditTurno(t)} aria-label="Editar turno"><Icon name="edit" size={16}/></Btn>
        <Btn size="xs" variant="danger" onClick={()=>onDelete(t.id)} aria-label="Eliminar turno"><Icon name="trash" size={16}/></Btn>
      </div>
    </div>
  );
}
