import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import PetAvatar from '../../components/ui/PetAvatar';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { abrirWhatsApp } from '../../lib/whatsapp';

export default function TurnoHoyItem({ turno: t, cliente: c, onCompletar, onNoVino, onEditTurno }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #dff5ec',flexWrap:'wrap'}}>
      <PetAvatar cliente={c} />
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          {t.dogName||c.dog}
          <Badge variant={t.estado==='confirmed'?'green':'orange'}>{t.estado==='confirmed'?'Confirmado':'Pendiente'}</Badge>
        </div>
        <div style={{fontSize:11,color:'#9a9090'}}>{t.servicio} · {t.hora} {t.forma_pago ? `(${t.forma_pago})` : ''}</div>
      </div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
        {c.tel && <WhatsAppBtn onClick={() => abrirWhatsApp(c.tel, t.dogName||c.dog, c.owner, t)} />}
        <Btn size="xs" onClick={() => onEditTurno(t)}>✏️</Btn>
        <Btn size="xs" onClick={() => onCompletar(t.id)}>✓</Btn>
        <Btn size="xs" variant="pink" onClick={() => onNoVino(t.id)}>✕</Btn>
      </div>
    </div>
  );
}
