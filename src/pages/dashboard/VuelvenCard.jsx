import Badge from '../../components/ui/Badge';
import PetAvatar from '../../components/ui/PetAvatar';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { fmtCada, fmtRestantes } from '../../lib/frecuencia';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { abrirWhatsAppVuelta } from '../../lib/whatsapp';

// Perros a los que ya les toca volver según su frecuencia y que no tienen turno agendado.
export default function VuelvenCard({ items, onOpenClient }) {
  return (
    <section aria-label="Ya les toca volver" style={{...cardStyle,padding:'18px 20px'}}>
      <h3 style={{...sectionTitleStyle,marginBottom:2}}>Ya les toca volver</h3>
      <p style={{fontSize:13,color:C.tintaSuave,marginBottom:8}}>Según cada cuánto viene cada perro · sin turno agendado</p>
      {!items.length ? <p style={{fontSize:14,color:C.tintaSuave,padding:'8px 0'}}>Nadie atrasado por ahora.</p>
        : items.map(({ cliente: c, frec: f }) => (
          <div key={c.id} style={{display:'grid',gridTemplateColumns:'auto minmax(0,1fr) 44px',alignItems:'center',gap:12,padding:'10px 0',minHeight:64,boxSizing:'border-box',borderTop:'1px solid #F0EBE4'}}>
            <PetAvatar cliente={c} />
            <button type="button" onClick={() => onOpenClient(c.id)} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',background:'none',border:'none',padding:0,textAlign:'left',fontFamily:'inherit',cursor:'pointer',color:C.tinta}}>
              <span style={{fontSize:15,fontWeight:600}}>{c.dog} <span style={{fontWeight:400,color:C.tintaSuave}}>· {c.owner}</span></span>
              <span style={{fontSize:12,color:C.tintaSuave}}>Cada {fmtCada(f.cadaDias)} · última hace {f.diasDesdeUltima} días</span>
              <span style={{marginTop:4}}><Badge variant={f.estado==='vencido'?'pink':'orange'}>{fmtRestantes(f)}</Badge></span>
            </button>
            {c.tel ? <WhatsAppBtn size="" onClick={() => abrirWhatsAppVuelta(c.tel, c.dog, c.owner)} /> : <span/>}
          </div>
        ))
      }
    </section>
  );
}
