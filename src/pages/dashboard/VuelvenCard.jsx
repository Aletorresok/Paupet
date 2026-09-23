import Badge from '../../components/ui/Badge';
import PetAvatar from '../../components/ui/PetAvatar';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { fmtCada, fmtRestantes } from '../../lib/frecuencia';
import { cardStyle, sectionTitleStyle } from '../../lib/styles';
import { abrirWhatsAppVuelta } from '../../lib/whatsapp';

// Perros a los que ya les toca volver según su frecuencia y que no tienen turno agendado.
export default function VuelvenCard({ items, onOpenClient }) {
  return (
    <div style={{...cardStyle,padding:'18px 20px'}}>
      <div style={{...sectionTitleStyle,marginBottom:2}}>Ya les toca volver</div>
      <p style={{fontSize:11,color:'#7a7070',marginBottom:10}}>Según cada cuánto viene cada perro · sin turno agendado</p>
      {!items.length ? <p style={{fontSize:13,color:'#7a7070',textAlign:'center',padding:16}}>Nadie atrasado por ahora 👌</p>
        : items.map(({ cliente: c, frec: f }) => (
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #dff5ec'}}>
            <PetAvatar cliente={c} />
            <div onClick={() => onOpenClient(c.id)} style={{flex:1,minWidth:0,cursor:'pointer'}}>
              <div style={{fontSize:13,fontWeight:500}}>{c.dog} <span style={{fontWeight:400,color:'#7a7070'}}>· {c.owner}</span></div>
              <div style={{fontSize:11,color:'#7a7070'}}>Viene cada {fmtCada(f.cadaDias)} · última hace {f.diasDesdeUltima} días</div>
            </div>
            <Badge variant={f.estado==='vencido'?'pink':'orange'}>{fmtRestantes(f)}</Badge>
            {c.tel && <WhatsAppBtn onClick={() => abrirWhatsAppVuelta(c.tel, c.dog, c.owner)} />}
          </div>
        ))
      }
    </div>
  );
}
