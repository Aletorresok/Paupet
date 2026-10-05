import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import { clienteDelPedido, cuandoCorto } from '../../lib/pedidos';
import { C } from '../../lib/styles';
import { turnosQueSePisan } from '../calendario/ayudaTurno';

const hace = iso => {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 60) return `hace ${Math.max(min, 1)} min`;
  if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
  const dias = Math.round(min / 1440);
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
};
const boton = {height:46,borderRadius:12,fontFamily:'inherit',fontSize:15,fontWeight:600,cursor:'pointer',padding:'0 8px'};
const claro = {...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta};
const oscuro = {...boton,border:'none',background:'#1F2A26',color:'white'};

// Un pedido de /turnos en la bandeja (lógica de `usePedidoActions`). Nada es un turno hasta que Pau lo acepta.
// nuevo → Otro horario / Aceptar (o Proponer horario si no pidió uno libre) · propuesto → esperando respuesta ·
// aceptado → falta avisarle que está confirmado. Rechazar, en el menú ⋯.
export default function PedidoItem({ p, clientes, turnos, acciones: a }) {
  const { tipo, cliente } = clienteDelPedido(p, clientes);
  const perro = tipo === 'mismo' ? cliente : { dog: p.perro, raza: p.raza };
  const quien = tipo === 'mismo' ? p.duenio : tipo === 'dueno' ? `otro perro de ${cliente.owner}` : `perro nuevo · ${p.duenio}`;
  const ocupado = p.estado === 'nuevo' && p.fecha && turnosQueSePisan(turnos, { fecha: p.fecha, hora: p.hora, duracion: 60 }).length > 0;
  const turno = p.turno_id ? turnos.find(t => t.id === p.turno_id) : null;
  const que = [p.servicios, tipo !== 'mismo' && p.raza, tipo !== 'mismo' && p.tamanio?.toLowerCase()].filter(Boolean).join(' · ');
  const menu = [
    { label: 'Rechazar y avisarle', icon: 'chat', onClick: () => a.rechazar(p, true), peligro: true },
    { label: 'Rechazar sin avisar', icon: 'x', onClick: () => a.rechazar(p, false), peligro: true },
  ];

  let cuando, botones;
  if (p.estado === 'aceptado') {
    cuando = <>Agendado: <b style={{fontWeight:600}}>{turno ? cuandoCorto(turno.fecha, turno.hora) : 'en la agenda'}</b> · falta avisarle</>;
    botones = [<button key="a" type="button" onClick={() => a.marcarAvisado(p)} style={claro}>Ya le avisé</button>,
      <button key="b" type="button" onClick={() => a.avisarConfirmado(p)} style={oscuro}>Avisarle 💬</button>];
  } else if (p.estado === 'propuesto') {
    cuando = <><span style={{color:C.ambar,fontWeight:600}}>Esperando respuesta</span> · le propusiste {cuandoCorto(p.fecha_prop, p.hora_prop)}</>;
    botones = [<button key="a" type="button" onClick={() => a.proponer(p)} style={claro}>Proponer otro</button>,
      <button key="b" type="button" onClick={() => a.agendar(p)} style={oscuro}>Aceptó · agendar</button>];
  } else if (p.fecha && !ocupado) {
    cuando = <>pidió {cuandoCorto(p.fecha, p.hora)}</>;
    botones = [<button key="a" type="button" onClick={() => a.proponer(p)} style={claro}>Otro horario</button>,
      <button key="b" type="button" onClick={() => a.agendar(p)} style={oscuro}>Aceptar</button>];
  } else {
    cuando = p.fecha ? <>pidió {cuandoCorto(p.fecha, p.hora)} <span style={{color:C.rosa,fontWeight:600}}>· ya está ocupado</span></>
      : <>sin horario{p.preferencia ? <>: “{p.preferencia}”</> : ''}</>;
    botones = [<button key="a" type="button" onClick={() => a.agendar(p)} style={claro}>Agendar directo</button>,
      <button key="b" type="button" onClick={() => a.proponer(p)} style={oscuro}>Proponer horario</button>];
  }

  return (
    <section aria-label={`Pedido de ${p.perro}`} style={{background:'white',border:`1px solid ${C.linea}`,borderRadius:18,padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <PetAvatar cliente={perro} size={40} />
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontSize:16,fontWeight:600}}>{p.perro} <span style={{fontWeight:400,color:C.tintaSuave}}>· {quien}</span></span>
          <span style={{fontSize:14,color:'#3E4743'}}>{que}{que && ' · '}{cuando}</span>
          {p.notas && <span style={{fontSize:13,color:C.ambar}}>{p.notas}</span>}
          <span style={{fontSize:12,color:C.tintaSuave}}>{hace(p.created_at)}</span>
        </div>
        {p.estado !== 'aceptado' && <MenuMas label={`Más acciones del pedido de ${p.perro}`} acciones={menu} />}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>{botones}</div>
    </section>
  );
}
