import Btn from '../../components/ui/Btn';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { fmtPeso } from '../../lib/utils';
import { abrirWhatsApp } from '../../lib/whatsapp';

const borderColor = e => e==='pending'?'#e8809a':e==='completed'?'#9a9090':'#5fbf9b';

export default function TurnoCard({ turno: t, cliente: c, onConfirmar, onCompletar, onNoVino, onEditTurno, onDelete }) {
  const completed = t.estado==='completed';
  return (
    <div style={{background:'#faf8f5',borderRadius:10,padding:'10px 12px',marginBottom:8,borderLeft:`3px solid ${borderColor(t.estado)}`,opacity:completed?.75:1}}>
      <div style={{fontSize:11,color:'#9a9090',fontWeight:600,textTransform:'uppercase'}}>{t.hora}</div>
      <div style={{fontSize:14,fontWeight:500}}>{t.dogName||c.dog}</div>
      <div style={{fontSize:12,color:'#9a9090'}}>{t.servicio} · {fmtPeso(t.precio)} {t.forma_pago ? `(${t.forma_pago})` : ''}</div>
      <div style={{display:'flex',gap:4,marginTop:7,flexWrap:'wrap'}}>
        {t.estado==='pending' && <Btn size="xs" onClick={()=>onConfirmar(t.id)}>✓ Confirmar</Btn>}
        {!completed && <Btn size="xs" onClick={()=>onCompletar(t.id)}>✓ Completar</Btn>}
        {!completed && <Btn size="xs" variant="pink" onClick={()=>onNoVino(t.id)}>✕ No vino</Btn>}
        {completed && <span style={{fontSize:10,color:'#5fbf9b',padding:'3px 8px',background:'#dff5ec',borderRadius:20,fontWeight:600}}>✓ Completado</span>}
        {c.tel && <WhatsAppBtn onClick={()=>abrirWhatsApp(c.tel,t.dogName||c.dog,c.owner,t)} />}
        <Btn size="xs" variant="ghost" onClick={()=>onEditTurno(t)}>✏️</Btn>
        <Btn size="xs" variant="danger" onClick={()=>onDelete(t.id)}>🗑</Btn>
      </div>
    </div>
  );
}
