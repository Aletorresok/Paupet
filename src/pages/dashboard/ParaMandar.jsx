import Icon from '../../components/ui/Icon';
import { marcarAvisado } from '../../lib/avisados';
import { C, cardStyle } from '../../lib/styles';
import { abrirWhatsApp, abrirWhatsAppVuelta } from '../../lib/whatsapp';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Celular: una sola fila oscura que lleva a Avisos ("6 mensajes para mandar").
// El número es el mismo que el de Avisos en el menú; "les toca volver" se menciona aparte.
export function ParaMandarFila({ pedidos, recordatorios, tituloDia, vuelven, onIr }) {
  const total = pedidos + recordatorios;
  if (!total && !vuelven) return null;
  const partes = [
    pedidos && plural(pedidos, 'pedido', 'pedidos'),
    recordatorios && `${recordatorios} ${tituloDia === 'mañana' ? 'de mañana' : `del ${tituloDia}`}`,
    vuelven && `${vuelven} les toca volver`,
  ].filter(Boolean);
  return (
    <button type="button" onClick={onIr} style={{display:'flex',alignItems:'center',gap:14,width:'100%',background:'#1F2A26',color:'white',border:'none',borderRadius:20,padding:'16px 18px',fontFamily:'inherit',textAlign:'left',cursor:'pointer'}}>
      <span style={{flex:'none',width:44,height:44,borderRadius:14,background:'#3A4A44',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="chat" size={22} /></span>
      <span style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:2}}>
        <span style={{fontSize:16,fontWeight:600}}>{total ? plural(total, 'mensaje para mandar', 'mensajes para mandar') : 'Avisos'}</span>
        <span style={{fontSize:13,color:'#D3DCD8'}}>{partes.join(' · ')}</span>
      </span>
      <Icon name="right" size={20} />
    </button>
  );
}

const enviarBtn = {height:44,padding:'0 14px',borderRadius:10,border:'1px solid #D9D5CE',background:'white',fontFamily:'inherit',fontWeight:600,fontSize:14,color:C.tinta,cursor:'pointer',flexShrink:0};

// PC: "Para mandar 💬" con los recordatorios y algunos "les toca volver", cada uno con su botón.
export function ParaMandarLista({ recordatorios, tituloDia, vuelven, clientes, onVerTodo }) {
  const cliente = id => clientes.find(c => c.id === id) || {};
  const filas = [
    ...recordatorios.map(t => {
      const c = cliente(t.clientId);
      return { key: `r${t.id}`, nombre: t.dogName || c.dog, que: `recordar ${tituloDia}${t.hora ? ` ${t.hora}` : ''}`,
        enviar: () => { abrirWhatsApp(c.tel, t.dogName || c.dog, c.owner, t); marcarAvisado(t); } };
    }),
    ...vuelven.filter(x => x.cliente.tel).slice(0, 3).map(({ cliente: c }) => ({
      key: `v${c.id}`, nombre: c.dog, que: 'le toca volver', enviar: () => abrirWhatsAppVuelta(c.tel, c.dog, c.owner),
    })),
  ];
  return (
    <section aria-label="Mensajes para mandar" style={{...cardStyle,borderRadius:20,padding:'18px 20px',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontSize:18,fontWeight:600}}>Para mandar 💬</span>
        <button type="button" onClick={onVerTodo} style={{background:'none',border:'none',fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.verde,cursor:'pointer',minHeight:44}}>Ver todo</button>
      </div>
      {!filas.length ? <p style={{fontSize:14,color:C.tintaSuave,padding:'8px 0'}}>¡Todo enviado! 💌</p>
        : filas.map((f, i) => (
          <div key={f.key} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderTop:i ? '1px solid #EFECE7' : 'none'}}>
            <span style={{flex:1,minWidth:0,fontSize:15}}>{f.nombre} <span style={{color:C.tintaSuave}}>· {f.que}</span></span>
            <button type="button" onClick={f.enviar} style={enviarBtn}>Enviar</button>
          </div>
        ))}
    </section>
  );
}
