import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import { clienteDelPedido, cuandoCorto } from '../../lib/pedidos';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { turnosQueSePisan } from '../calendario/ayudaTurno';

const hace = iso => {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 60) return `hace ${Math.max(min, 1)} min`;
  if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
  return `hace ${Math.round(min / 1440)} días`;
};

const etiqueta = (bg, fg) => ({display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,background:bg,color:fg,borderRadius:999,padding:'2px 9px'});

function Pedido({ p, clientes, turnos, acciones: a }) {
  const { tipo, cliente } = clienteDelPedido(p, clientes);
  const perroMostrado = tipo === 'mismo' ? cliente : { dog: p.perro, raza: p.raza };
  const ocupado = p.estado === 'nuevo' && p.fecha && turnosQueSePisan(turnos, { fecha: p.fecha, hora: p.hora, duracion: 60 }).length > 0;
  const turno = p.turno_id ? turnos.find(t => t.id === p.turno_id) : null;
  const menu = [
    { label: 'Rechazar y avisarle', icon: 'chat', onClick: () => a.rechazar(p, true), peligro: true },
    { label: 'Rechazar sin avisar', icon: 'x', onClick: () => a.rechazar(p, false), peligro: true },
  ];

  return (
    <div style={{display:'flex',gap:12,padding:'12px 0',borderTop:'1px solid #F0EBE4',alignItems:'flex-start'}}>
      <PetAvatar cliente={perroMostrado} size={44} />
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',gap:6,alignItems:'baseline',flexWrap:'wrap'}}>
          <strong style={{fontSize:16}}>{p.perro}</strong>
          <span style={{fontSize:14,color:C.tintaSuave}}>· {p.duenio}</span>
          <span style={{fontSize:12,color:C.tintaSuave}}>· {hace(p.created_at)}</span>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {tipo === 'mismo' && <span style={etiqueta(C.mentaSuave, C.verde)}>Ya es cliente</span>}
          {tipo === 'dueno' && <span style={etiqueta(C.mentaSuave, C.verde)}>Otro perro de {cliente.owner}</span>}
          {tipo === 'nuevo' && <span style={etiqueta('#EEF1EF', '#46524D')}>Cliente nuevo</span>}
          {p.estado === 'propuesto' && <span style={etiqueta(C.ambarSuave, C.ambar)}>Esperando respuesta</span>}
          {p.estado === 'aceptado' && <span style={etiqueta(C.mentaSuave, C.verde)}><Icon name="check" size={12} strokeWidth={2.4} />Agendado</span>}
        </div>
        <div style={{fontSize:14}}>{p.servicios}{p.raza && tipo !== 'mismo' ? ` · ${p.raza}` : ''}{p.tamanio ? ` · ${p.tamanio.toLowerCase()}` : ''}</div>
        <div style={{fontSize:14}}>
          {p.estado === 'aceptado' && turno ? <>Turno: <strong>{cuandoCorto(turno.fecha, turno.hora)}</strong></>
            : p.estado === 'propuesto' ? <>Le propusiste <strong>{cuandoCorto(p.fecha_prop, p.hora_prop)}</strong>{p.fecha && <span style={{color:C.tintaSuave}}> (había pedido {cuandoCorto(p.fecha, p.hora)})</span>}</>
            : p.fecha ? <>Pidió <strong>{cuandoCorto(p.fecha, p.hora)}</strong>{ocupado && <span style={{color:C.rosa,fontWeight:600}}> · ese horario ya está ocupado</span>}</>
            : <>Sin horario{p.preferencia ? <>: <em>"{p.preferencia}"</em></> : ''}</>}
        </div>
        {p.notas && <div style={{fontSize:13,color:C.ambar}}>{p.notas}</div>}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
          {p.estado === 'nuevo' && p.fecha && !ocupado && <Btn size="sm" onClick={() => a.agendar(p)}><Icon name="check" size={16} strokeWidth={2} />Aceptar</Btn>}
          {p.estado === 'propuesto' && <Btn size="sm" onClick={() => a.agendar(p)}><Icon name="check" size={16} strokeWidth={2} />Aceptó · agendar</Btn>}
          {(p.estado === 'nuevo' || p.estado === 'propuesto') && (
            <Btn size="sm" variant={p.fecha && !ocupado && p.estado === 'nuevo' ? 'ghost' : p.estado === 'propuesto' ? 'ghost' : 'primary'} onClick={() => a.proponer(p)}>
              <Icon name="calendar" size={16} />{p.fecha || p.estado === 'propuesto' ? 'Proponer otro' : 'Proponer horario'}
            </Btn>
          )}
          {p.estado === 'nuevo' && !p.fecha && <Btn size="sm" variant="ghost" onClick={() => a.agendar(p)}>Agendar directo</Btn>}
          {p.estado === 'aceptado' && <>
            <Btn size="sm" onClick={() => a.avisarConfirmado(p)} style={{background:C.whatsapp,color:'white'}}><Icon name="chat" size={16} />Avisarle que está confirmado</Btn>
            <Btn size="sm" variant="ghost" onClick={() => a.marcarAvisado(p)}>Ya le avisé</Btn>
          </>}
          {p.estado !== 'aceptado' && <div style={{marginLeft:'auto'}}><MenuMas label={`Más acciones del pedido de ${p.perro}`} acciones={menu} /></div>}
        </div>
      </div>
    </div>
  );
}

// Pedidos hechos en /turnos que Pau tiene que atender. Nada es un turno hasta que ella lo acepta.
export default function PedidosCard({ pedidos, clientes, turnos, acciones }) {
  if (!pedidos.length) return null;
  const sinResponder = pedidos.filter(p => p.estado === 'nuevo').length;
  return (
    <section aria-label="Pedidos de turno" style={{...cardStyle,padding:'18px 20px',borderColor:C.mentaBorde,borderWidth:1.5,marginBottom:20}}>
      <h3 style={{...sectionTitleStyle,marginBottom:2}}>Pedidos de turno</h3>
      <p style={{fontSize:13,color:C.tintaSuave,marginBottom:4}}>
        {sinResponder ? `${sinResponder} sin responder` : 'Todos respondidos'} · llegan desde la página para pedir turno
      </p>
      {pedidos.map(p => <Pedido key={p.id} p={p} clientes={clientes} turnos={turnos} acciones={acciones} />)}
    </section>
  );
}
