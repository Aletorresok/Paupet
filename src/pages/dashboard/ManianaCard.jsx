import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { abrirWhatsApp } from '../../lib/whatsapp';

// Turnos de mañana, con un botón para mandar el recordatorio por WhatsApp a cada uno.
export default function ManianaCard({ turnos, clientes }) {
  const lista = [...turnos].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  return (
    <section aria-label="Recordatorios de mañana" style={{...cardStyle,padding:'18px 20px'}}>
      <h3 style={{...sectionTitleStyle,marginBottom:2}}>Recordatorios de mañana</h3>
      <p style={{fontSize:13,color:C.tintaSuave,marginBottom:8}}>Tocá el botón para mandarle el recordatorio a cada uno</p>
      {!lista.length ? <p style={{fontSize:14,color:C.tintaSuave,padding:'8px 0'}}>Mañana no hay turnos.</p>
        : lista.map(t => {
          const c = clientes.find(x => x.id === t.clientId) || {};
          return (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:'1px solid #F0EBE4'}}>
              <span style={{width:46,fontSize:14,fontWeight:600}}>{t.hora || '–'}</span>
              <span style={{flex:1,minWidth:0,fontSize:14}}>{t.dogName || c.dog} <span style={{color:C.tintaSuave}}>· {c.owner || ''}</span></span>
              {c.tel ? <WhatsAppBtn onClick={()=>abrirWhatsApp(c.tel, t.dogName||c.dog, c.owner, t)} />
                : <span style={{fontSize:12,color:C.tintaSuave}}>Sin teléfono</span>}
            </div>
          );
        })
      }
    </section>
  );
}
