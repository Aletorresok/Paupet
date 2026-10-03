import { useState } from 'react';
import Badge from '../../components/ui/Badge';
import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { PAUSA_SIEMPRE, fmtCada, fmtRestantes, pausaHasta } from '../../lib/frecuencia';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { abrirWhatsAppVuelta } from '../../lib/whatsapp';

const fechaCorta = f => { const [, m, d] = f.split('-'); return `${parseInt(d)}/${parseInt(m)}`; };
const textoPausa = hasta => hasta === PAUSA_SIEMPRE ? 'No se muestra más' : `Oculto hasta el ${fechaCorta(hasta)}`;

const linkStyle = {background:'none',border:'none',padding:'8px 0',fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.verde,cursor:'pointer'};

// Perros a los que ya les toca volver según su frecuencia y que no tienen turno agendado.
// Pau puede sacar a uno de la lista por unos días o para siempre (`onPausar`, si la base tiene la migración 7).
export default function VuelvenCard({ items, ocultos = [], onOpenClient, onPausar }) {
  const [verOcultos, setVerOcultos] = useState(false);

  const pausar = (c, dias) => {
    const hasta = pausaHasta(dias);
    onPausar(c.id, hasta, dias == null ? `No se te va a recordar más a ${c.dog}` : `${c.dog} vuelve a aparecer el ${fechaCorta(hasta)}`);
  };

  return (
    <section aria-label="Ya les toca volver" style={{...cardStyle,padding:'18px 20px'}}>
      <h3 style={{...sectionTitleStyle,marginBottom:2}}>Ya les toca volver</h3>
      <p style={{fontSize:13,color:C.tintaSuave,marginBottom:8}}>Según cada cuánto viene cada perro · sin turno agendado</p>
      {!items.length ? <p style={{fontSize:14,color:C.tintaSuave,padding:'8px 0'}}>Nadie atrasado por ahora.</p>
        : items.map(({ cliente: c, frec: f }) => (
          <div key={c.id} style={{display:'grid',gridTemplateColumns:`auto minmax(0,1fr) 44px${onPausar ? ' 44px' : ''}`,alignItems:'center',gap:onPausar ? 8 : 12,padding:'10px 0',minHeight:64,boxSizing:'border-box',borderTop:'1px solid #F0EBE4'}}>
            <PetAvatar cliente={c} size={44} />
            <button type="button" onClick={() => onOpenClient(c.id)} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',background:'none',border:'none',padding:0,paddingLeft:onPausar ? 4 : 0,textAlign:'left',fontFamily:'inherit',cursor:'pointer',color:C.tinta}}>
              <span style={{fontSize:15,fontWeight:600}}>{c.dog} <span style={{fontWeight:400,color:C.tintaSuave}}>· {c.owner}</span></span>
              <span style={{fontSize:12,color:C.tintaSuave}}>Cada {fmtCada(f.cadaDias)} · última hace {f.diasDesdeUltima} días</span>
              <span style={{marginTop:4}}><Badge variant={f.estado==='vencido'?'pink':'orange'}>{fmtRestantes(f)}</Badge></span>
            </button>
            {c.tel ? <WhatsAppBtn size="" onClick={() => abrirWhatsAppVuelta(c.tel, c.dog, c.owner)} /> : <span/>}
            {onPausar && (
              <MenuMas label={`Sacar a ${c.dog} de la lista`} acciones={[
                { label:'Ya le escribí · ocultar 7 días', icon:'check', onClick:() => pausar(c, 7) },
                { label:'Ocultar 15 días', icon:'history', onClick:() => pausar(c, 15) },
                { label:'Ocultar 30 días', icon:'history', onClick:() => pausar(c, 30) },
                { label:'No mostrar más', icon:'x', onClick:() => pausar(c, null), peligro:true },
              ]} />
            )}
          </div>
        ))
      }
      {onPausar && ocultos.length > 0 && (
        <div style={{borderTop:'1px solid #F0EBE4',paddingTop:4}}>
          <button type="button" aria-expanded={verOcultos} onClick={() => setVerOcultos(v => !v)} style={linkStyle}>
            {verOcultos ? 'Esconder' : 'Ver'} {ocultos.length === 1 ? '1 oculto' : `${ocultos.length} ocultos`}
          </button>
          {verOcultos && ocultos.map(({ cliente: c }) => (
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0'}}>
              <PetAvatar cliente={c} size={32} />
              <button type="button" onClick={() => onOpenClient(c.id)} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',background:'none',border:'none',padding:0,textAlign:'left',fontFamily:'inherit',cursor:'pointer',color:C.tinta}}>
                <span style={{fontSize:14,fontWeight:600}}>{c.dog} <span style={{fontWeight:400,color:C.tintaSuave}}>· {c.owner}</span></span>
                <span style={{fontSize:12,color:C.tintaSuave}}>{textoPausa(c.vuelta_pausa)}</span>
              </button>
              <button type="button" onClick={() => onPausar(c.id, null, `${c.dog} vuelve a la lista`)} style={{...linkStyle,minHeight:44}}>Mostrar</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
