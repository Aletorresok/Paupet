import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { avisados, marcarAvisado } from '../../lib/avisados';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { abrirWhatsApp } from '../../lib/whatsapp';

// Recordatorios del próximo día con turnos (mañana, o el lunes si hoy es sábado).
// Recuerda en este dispositivo a quién ya se le mandó, y ofrece "mandar al siguiente".
export default function ManianaCard({ turnos, clientes, titulo = 'mañana' }) {
  const [enviados, setEnviados] = useState(avisados);
  const de = titulo === 'mañana' ? 'de mañana' : `del ${titulo}`;
  const lista = [...turnos].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
    .map(t => ({ t, c: clientes.find(x => x.id === t.clientId) || {} }));
  const conTel = lista.filter(x => x.c.tel);
  const faltan = conTel.filter(x => !enviados[x.t.id]);

  const enviar = ({ t, c }) => {
    abrirWhatsApp(c.tel, t.dogName || c.dog, c.owner, t);
    setEnviados(marcarAvisado(t));
  };

  return (
    <section aria-label={`Recordatorios ${de}`} style={{...cardStyle,padding:'18px 20px'}}>
      <h3 style={{...sectionTitleStyle,marginBottom:2}}>Recordatorios {de}</h3>
      <p style={{fontSize:13,color:C.tintaSuave,marginBottom:8}}>
        {!conTel.length ? 'Tocá el botón para mandarle el recordatorio a cada uno'
          : faltan.length ? `Enviados ${conTel.length - faltan.length} de ${conTel.length}` : '¡Listo! Ya les avisaste a todos.'}
      </p>
      {faltan.length > 0 && conTel.length > 1 && (
        <Btn size="sm" onClick={() => enviar(faltan[0])} style={{width:'100%',marginBottom:8,background:C.whatsapp,color:'white'}}>
          <Icon name="chat" size={16} />Avisar a {faltan[0].t.dogName || faltan[0].c.dog} ({conTel.length - faltan.length + 1} de {conTel.length})
        </Btn>
      )}
      {!lista.length ? <p style={{fontSize:14,color:C.tintaSuave,padding:'8px 0'}}>No hay turnos {titulo === 'mañana' ? 'mañana' : `el ${titulo}`}.</p>
        : lista.map(({ t, c }) => (
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:'1px solid #F0EBE4'}}>
            <span style={{width:46,fontSize:14,fontWeight:600}}>{t.hora || '–'}</span>
            <span style={{flex:1,minWidth:0,fontSize:14}}>{t.dogName || c.dog} <span style={{color:C.tintaSuave}}>· {c.owner || ''}</span></span>
            {enviados[t.id] && <span style={{fontSize:12,fontWeight:600,color:C.verde,display:'inline-flex',alignItems:'center',gap:3}}><Icon name="check" size={14} strokeWidth={2.2}/>Enviado</span>}
            {c.tel ? <WhatsAppBtn onClick={() => enviar({ t, c })} />
              : <span style={{fontSize:12,color:C.tintaSuave}}>Sin teléfono</span>}
          </div>
        ))
      }
    </section>
  );
}
