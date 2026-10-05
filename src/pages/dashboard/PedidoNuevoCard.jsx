import { clienteDelPedido, cuandoCorto } from '../../lib/pedidos';
import { C, cardStyle } from '../../lib/styles';

const btn = {height:44,borderRadius:12,fontFamily:'inherit',fontSize:14,fontWeight:600,cursor:'pointer'};

// PC: el pedido de turno más reciente sin responder, con Aceptar / Otro horario. El resto, en Avisos.
export default function PedidoNuevoCard({ pedidos, clientes, acciones, onVerTodos }) {
  const nuevos = pedidos.filter(p => p.estado === 'nuevo');
  if (!nuevos.length) return null;
  const p = nuevos[0];
  const { tipo, cliente } = clienteDelPedido(p, clientes);
  const quien = tipo === 'mismo' ? `ya es cliente · ${p.duenio}` : tipo === 'dueno' ? `otro perro de ${cliente.owner}` : `perro nuevo · ${p.duenio}`;
  const cuando = p.fecha ? cuandoCorto(p.fecha, p.hora) : p.preferencia ? `"${p.preferencia}"` : 'sin horario';
  return (
    <section aria-label="Pedido de turno" style={{...cardStyle,borderRadius:20,padding:'18px 20px',display:'flex',flexDirection:'column',gap:12}}>
      <span style={{fontSize:13,fontWeight:600,letterSpacing:'.06em',color:C.tintaSuave}}>PEDIDO DE TURNO · NUEVO</span>
      <span style={{fontSize:16}}>
        <b style={{fontWeight:600}}>{p.perro}</b> <span style={{color:C.tintaSuave}}>· {quien}</span><br/>
        <span style={{fontSize:14,color:'#3E4743'}}>{p.servicios} · {cuando}</span>
      </span>
      <span style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
        <button type="button" onClick={() => acciones.proponer(p)} style={{...btn,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>Otro horario</button>
        <button type="button" onClick={() => acciones.agendar(p)} style={{...btn,border:'none',background:'#1F2A26',color:'white'}}>Aceptar</button>
      </span>
      {nuevos.length > 1 && (
        <button type="button" onClick={onVerTodos} style={{background:'none',border:'none',fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.verde,cursor:'pointer',minHeight:44,alignSelf:'flex-start',padding:0}}>
          Ver los otros {nuevos.length - 1} en Avisos
        </button>
      )}
    </section>
  );
}
