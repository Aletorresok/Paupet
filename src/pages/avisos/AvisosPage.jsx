import { useState } from 'react';
import enviadoImg from '../../assets/ilustraciones/enviado.webp';
import Icon from '../../components/ui/Icon';
import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import { useResp } from '../../context/resp';
import { useAvisados } from '../../hooks/useAvisados';
import { marcarAvisado } from '../../lib/avisados';
import { colaMensajes, proximoDiaConTurnos } from '../../lib/bandeja';
import { DIAS_ES } from '../../lib/constants';
import { PAUSA_SIEMPRE, clientesParaVolver, enPausa, fmtCada, fmtRestantes, pausaHasta } from '../../lib/frecuencia';
import { C, serif } from '../../lib/styles';
import { parseFecha } from '../../lib/utils';
import { abrirWhatsApp, abrirWhatsAppVuelta } from '../../lib/whatsapp';
import FilaMensaje from './FilaMensaje';
import PedidoItem from './PedidoItem';

const titulo = {fontSize:13,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:C.tintaSuave,margin:'6px 2px 0'};
const lista = {background:'white',border:`1px solid ${C.linea}`,borderRadius:18,padding:'2px 16px'};
const link = {background:'none',border:'none',padding:0,minHeight:44,fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.verde,cursor:'pointer'};
const fechaCorta = f => { const [, m, d] = f.split('-'); return `${parseInt(d)}/${parseInt(m)}`; };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Bandeja de Avisos (maqueta `Avisos.dc.html`): pedidos de turno, recordatorios del próximo día con turnos y
// "les toca volver". El botón grande abre el WhatsApp del siguiente que falta y lo marca enviado.
// Un recordatorio enviado se guarda en este dispositivo (`lib/avisados.js`); a uno de "les toca volver" se lo
// saca de la lista 7 días ("Ya le escribí"), y en esta pantalla queda como Enviado hasta salir.
export default function AvisosPage({ clientes, turnos, pedidos = [], pedidoActions, caps = {}, onOpenClient, onPausarVuelta }) {
  const { isMob, isTab } = useResp();
  const enviados = useAvisados();
  const [escritos, setEscritos] = useState([]); // ids de clientes de "les toca volver" a los que se escribió acá
  const [verOcultos, setVerOcultos] = useState(false);
  const onPausar = caps.vueltaPausa ? onPausarVuelta : null;

  const dia = proximoDiaConTurnos(turnos);
  const d = parseFecha(dia.fecha);
  const recordar = [...dia.turnos].sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'))
    .map(t => ({ t, c: clientes.find(x => x.id === t.clientId) || {} }))
    .map(x => ({ ...x, id: `t${x.t.id}`, tel: x.c.tel, enviado: !!enviados[x.t.id] }));
  const paraVolver = clientesParaVolver(clientes, turnos);
  const vuelven = paraVolver.filter(x => !enPausa(x.cliente) || escritos.includes(x.cliente.id))
    .map(x => ({ ...x, c: x.cliente, id: `c${x.cliente.id}`, tel: x.cliente.tel, enviado: escritos.includes(x.cliente.id) }));
  const ocultos = paraVolver.filter(x => enPausa(x.cliente) && !escritos.includes(x.cliente.id));
  const pedidosOrden = [...pedidos].sort((a, b) => (a.estado === 'propuesto') - (b.estado === 'propuesto'));
  const pedidosPorAtender = pedidos.filter(p => p.estado !== 'propuesto').length;
  const cola = colaMensajes([...recordar, ...vuelven]);

  const enviarRecordatorio = ({ t, c }) => { abrirWhatsApp(c.tel, t.dogName || c.dog, c.owner, t); marcarAvisado(t); };
  const enviarVuelta = ({ c }) => {
    abrirWhatsAppVuelta(c.tel, c.dog, c.owner);
    if (!escritos.includes(c.id)) {
      setEscritos(e => [...e, c.id]);
      onPausar?.(c.id, pausaHasta(7), null);
    }
  };
  const enviar = x => x.t ? enviarRecordatorio(x) : enviarVuelta(x);
  const pausar = (c, dias) => {
    const hasta = pausaHasta(dias);
    onPausar(c.id, hasta, dias == null ? `No se te va a recordar más a ${c.dog}` : `${c.dog} vuelve a aparecer el ${fechaCorta(hasta)}`);
  };

  const resumen = [cola.pendientes ? `${plural(cola.pendientes, 'mensaje', 'mensajes')} por mandar` : 'Todo enviado',
    pedidosPorAtender > 0 && `${plural(pedidosPorAtender, 'pedido', 'pedidos')} por atender`].filter(Boolean).join(' · ');

  const arriba = cola.siguiente ? (
    <button type="button" onClick={() => enviar(cola.siguiente)}
      style={{height:56,borderRadius:14,border:'none',background:C.menta,color:C.sobreMenta,fontFamily:'inherit',fontSize:17,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'0 12px'}}>
      <Icon name="chat" size={20} />Enviar a {cola.siguiente.t ? cola.siguiente.t.dogName || cola.siguiente.c.dog : cola.siguiente.c.dog} ({cola.numero} de {cola.total})
    </button>
  ) : (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'4px 0'}}>
      <img src={enviadoImg} alt="" style={{width:140,height:'auto'}} />
      <span style={{fontSize:17,fontWeight:600}}>¡Todo enviado! 💌</span>
    </div>
  );

  const seccionPedidos = pedidos.length > 0 && (
    <>
      <h2 style={titulo}>{pedidos.length === 1 ? 'Pedido de turno' : `Pedidos de turno · ${pedidos.length}`}</h2>
      {pedidosOrden.map(p => <PedidoItem key={p.id} p={p} clientes={clientes} turnos={turnos} acciones={pedidoActions} />)}
    </>
  );

  const mensajes = (
    <>
      {recordar.length > 0 && <>
        <h2 style={titulo}>Recordar · {DIAS_ES[d.getDay()].toLowerCase()} {d.getDate()}{dia.titulo === 'mañana' ? ' (mañana)' : ''}</h2>
        <div style={lista}>
          {recordar.map((x, i) => (
            <FilaMensaje key={x.id} primera={i === 0} cliente={x.c} perro={x.t.dogName || x.c.dog}
              detalle={[x.t.hora || 'sin hora', x.t.servicio].filter(Boolean).join(' · ')} enviado={x.enviado} onEnviar={() => enviarRecordatorio(x)} />
          ))}
        </div>
      </>}

      {(vuelven.length > 0 || ocultos.length > 0) && <h2 style={titulo}>Les toca volver</h2>}
      {vuelven.length > 0 && (
        <div style={lista}>
          {vuelven.map((x, i) => (
            <FilaMensaje key={x.id} primera={i === 0} cliente={x.c} perro={x.c.dog} onAbrir={() => onOpenClient(x.c.id)}
              detalle={x.enviado ? (onPausar ? 'Ya le escribiste · vuelve a aparecer en 7 días si no saca turno' : 'Ya le escribiste')
                : `${fmtRestantes(x.frec)} · cada ${fmtCada(x.frec.cadaDias)}`}
              colorDetalle={x.enviado ? C.tintaSuave : x.frec.estado === 'vencido' ? '#8E2A4A' : '#6E4300'}
              enviado={x.enviado} onEnviar={() => enviarVuelta(x)}
              menu={onPausar && !x.enviado && (
                <MenuMas label={`Sacar a ${x.c.dog} de la lista`} acciones={[
                  { label:'Ya le escribí · ocultar 7 días', icon:'check', onClick:() => pausar(x.c, 7) },
                  { label:'Ocultar 15 días', icon:'history', onClick:() => pausar(x.c, 15) },
                  { label:'Ocultar 30 días', icon:'history', onClick:() => pausar(x.c, 30) },
                  { label:'No mostrar más', icon:'x', onClick:() => pausar(x.c, null), peligro:true },
                ]} />
              )} />
          ))}
        </div>
      )}
      {onPausar && ocultos.length > 0 && (
        <div style={{display:'flex',flexDirection:'column'}}>
          <button type="button" aria-expanded={verOcultos} onClick={() => setVerOcultos(v => !v)} style={{...link,alignSelf:'flex-start',padding:'0 2px'}}>
            {verOcultos ? 'Esconder' : 'Ver'} {ocultos.length === 1 ? '1 oculto' : `${ocultos.length} ocultos`}
          </button>
          {verOcultos && ocultos.map(({ cliente: c }) => (
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 2px'}}>
              <PetAvatar cliente={c} size={32} />
              <button type="button" onClick={() => onOpenClient(c.id)} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',background:'none',border:'none',padding:0,textAlign:'left',fontFamily:'inherit',cursor:'pointer',color:C.tinta}}>
                <span style={{fontSize:14,fontWeight:600}}>{c.dog} <span style={{fontWeight:400,color:C.tintaSuave}}>· {c.owner}</span></span>
                <span style={{fontSize:12,color:C.tintaSuave}}>{c.vuelta_pausa === PAUSA_SIEMPRE ? 'No se muestra más' : `Oculto hasta el ${fechaCorta(c.vuelta_pausa)}`}</span>
              </button>
              <button type="button" onClick={() => onPausar(c.id, null, `${c.dog} vuelve a la lista`)} style={link}>Mostrar</button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const dosColumnas = !isMob && !isTab;
  return (
    <section style={{display:'flex',flexDirection:'column',gap:12,maxWidth:dosColumnas ? 1100 : 640}}>
      <header style={{display:'flex',flexDirection:'column',gap:2}}>
        <h1 style={{margin:0,fontFamily:serif,fontSize:isMob ? 28 : 34,fontWeight:600,lineHeight:1.1}}>Avisos</h1>
        <span style={{fontSize:15,color:C.tintaSuave}}>{resumen}</span>
      </header>
      {dosColumnas ? (
        <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
          <div style={{flex:'3 1 0',minWidth:0,display:'flex',flexDirection:'column',gap:12}}>{arriba}{mensajes}</div>
          {seccionPedidos && <div style={{flex:'2 1 0',minWidth:0,display:'flex',flexDirection:'column',gap:12}}>{seccionPedidos}</div>}
        </div>
      ) : <>{arriba}{seccionPedidos}{mensajes}</>}
    </section>
  );
}
