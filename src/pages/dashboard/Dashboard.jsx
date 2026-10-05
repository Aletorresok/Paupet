import { useEffect, useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import EstadoVacio from '../../components/ui/EstadoVacio';
import Icon from '../../components/ui/Icon';
import PauAvatar from '../../components/ui/PauAvatar';
import AvisosCard from '../../components/ui/AvisosCard';
import { useAvisados } from '../../hooks/useAvisados';
import { proximoDiaConTurnos, recordatoriosSinEnviar } from '../../lib/bandeja';
import { DIAS_ES, MESES } from '../../lib/constants';
import { clientesParaVolver, enPausa } from '../../lib/frecuencia';
import { huecosDelDia } from '../../lib/huecosLibres';
import { respaldoVencido } from '../../lib/respaldo';
import { C, cardStyle, serif } from '../../lib/styles';
import { toISODate } from '../../lib/utils';
import { sinCobrarAntes, turnoActual } from './dashboardStats';
import ProximoTurnoCard from './ProximoTurnoCard';
import ModoMesa from '../mesa/ModoMesa';
import RestoDelDia from './RestoDelDia';
import PedidoNuevoCard from './PedidoNuevoCard';
import { ParaMandarFila, ParaMandarLista } from './ParaMandar';

// "¡Buen día, Pau! ☀️", según la hora.
const fraseSaludo = h => h < 6 ? '¡Buenas noches, Pau! 🌙' : h < 13 ? '¡Buen día, Pau! ☀️' : h < 20 ? '¡Buenas tardes, Pau! 🌤️' : '¡Buenas noches, Pau! 🌙';

export default function Dashboard({ clientes, turnos, config, pedidos = [], pedidoActions, caps = {}, toast, onNav, onOpenClient, onNuevoTurno, onCompletar, onNoVino, onEditTurno }) {
  const { isMob, isTab } = useResp();
  const enviados = useAvisados();
  // Se vuelve a calcular cada minuto: el turno de ahora y los huecos cambian con la hora.
  const [hoy, setHoy] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setHoy(new Date()), 60000); return () => clearInterval(id); }, []);
  const hoyISO = toISODate(hoy);
  // Modo mesa del turno tocado. Se cierra solo cuando el turno se cobra o se borra (No vino).
  const [mesaId, setMesaId] = useState(null);
  const turnoMesa = mesaId && turnos.find(t => t.id === mesaId && t.estado !== 'completed');
  if (mesaId && !turnoMesa) setMesaId(null);

  const turnosHoy = turnos.filter(t => t.fecha === hoyISO);
  const quedan = turnosHoy.filter(t => t.estado !== 'completed').length;
  const actual = turnoActual(turnosHoy, hoy);
  const resto = turnosHoy.filter(t => t.estado !== 'completed' && t.id !== actual?.turno.id);
  const sinCobrar = sinCobrarAntes(turnosHoy, actual, hoy).map(t => t.id);
  const huecos = huecosDelDia(config, turnos, hoyISO, hoy);

  const dia = proximoDiaConTurnos(turnos, hoy);
  const recordatorios = recordatoriosSinEnviar(dia.turnos, clientes, enviados);
  const pedidosParaMandar = pedidos.filter(p => p.estado !== 'propuesto');
  const vuelven = clientesParaVolver(clientes, turnos).filter(x => !enPausa(x.cliente));

  const titulo = quedan ? `${quedan === 1 ? 'Queda 1 turno' : `Quedan ${quedan} turnos`} 🐾`
    : turnosHoy.length ? 'Terminaste por hoy ✅' : 'Hoy no hay turnos 💤';
  const fecha = isMob ? `${DIAS_ES[hoy.getDay()]} ${hoy.getDate()}/${hoy.getMonth() + 1}` : `${DIAS_ES[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;
  const dosColumnas = !isMob && !isTab;

  const tarjetaActual = actual ? (
    <ProximoTurnoCard
      actual={actual}
      cliente={clientes.find(c => c.id === actual.turno.clientId) || {}}
      onAbrir={() => setMesaId(actual.turno.id)}
      onCobrar={onCompletar} onEditTurno={onEditTurno} onNoVino={onNoVino}
    />
  ) : !turnosHoy.length ? (
    <section style={{...cardStyle,borderRadius:20,padding:'8px 18px 18px'}}>
      <EstadoVacio ilustracion="durmiendo" titulo="Hoy no hay turnos" texto="Buen momento para mirar a quién le toca volver." tamanio={150} />
    </section>
  ) : null;

  const restoDelDia = (
    <RestoDelDia turnos={resto} huecos={huecos} clientes={clientes} sinCobrar={sinCobrar} onCobrar={onCompletar}
      onAbrirTurno={onEditTurno} onDarTurno={hora => onNuevoTurno(hoyISO, hora)} />
  );

  const mesa = turnoMesa && (
    <ModoMesa turno={turnoMesa} cliente={clientes.find(c => c.id === turnoMesa.clientId) || {}} fotosHabilitadas={caps.fotos} toast={toast}
      onClose={() => setMesaId(null)} onCobrar={() => onCompletar(turnoMesa.id)} onEditTurno={() => onEditTurno(turnoMesa)}
      onNoVino={() => onNoVino(turnoMesa.id)} onVerFicha={() => onOpenClient(turnoMesa.clientId)} />
  );

  return (
    <section style={{display:'flex',flexDirection:'column',gap:isMob ? 16 : 22}}>
      {mesa}
      <header style={{display:'flex',alignItems:isMob ? 'center' : 'flex-end',justifyContent:'space-between',gap:isMob ? 10 : 16,flexWrap:isMob ? 'nowrap' : 'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
          {isMob && (
            <span style={{position:'relative',flexShrink:0}}>
              <PauAvatar size={52} onClick={() => onNav('config')} label={respaldoVencido() ? 'Ajustes (falta hacer la copia de seguridad)' : 'Ajustes'} />
              {respaldoVencido() && <span aria-hidden="true" style={{position:'absolute',top:2,right:2,width:12,height:12,borderRadius:'50%',background:C.ambar,border:'2px solid white'}} />}
            </span>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:isMob ? 2 : 4,minWidth:0}}>
            <span style={{fontSize:isMob ? 14 : 15,color:C.tintaSuave}}>{fraseSaludo(hoy.getHours())} {fecha}</span>
            <h1 style={{margin:0,fontFamily:serif,fontSize:isMob ? 24 : 34,fontWeight:600,lineHeight:1.15}}>{titulo}</h1>
          </div>
        </div>
        {isMob ? (
          <button type="button" onClick={() => onNav('clientes')} aria-label="Buscar perro" style={{flexShrink:0,width:44,height:44,borderRadius:14,background:'white',border:`1px solid ${C.linea}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.tinta,cursor:'pointer'}}>
            <Icon name="search" size={22} />
          </button>
        ) : (
          <span style={{display:'flex',gap:10}}>
            <Btn variant="ghost" onClick={() => onNav('clientes')}><Icon name="search" />Buscar perro</Btn>
            <Btn onClick={() => onNuevoTurno(hoyISO)}><Icon name="plus" strokeWidth={2}/>Nuevo turno</Btn>
          </span>
        )}
      </header>

      <AvisosCard compacto habilitado={caps.push} toast={toast} />

      {dosColumnas ? (
        <div style={{display:'flex',flexWrap:'wrap',gap:20,alignItems:'flex-start'}}>
          <div style={{flex:'2 1 480px',minWidth:0,display:'flex',flexDirection:'column',gap:20}}>
            {tarjetaActual}
            {restoDelDia}
          </div>
          <div style={{flex:'1 1 320px',minWidth:0,display:'flex',flexDirection:'column',gap:20}}>
            <PedidoNuevoCard pedidos={pedidos} clientes={clientes} acciones={pedidoActions} onVerTodos={() => onNav('avisos')} />
            <ParaMandarLista recordatorios={recordatorios} tituloDia={dia.titulo} vuelven={vuelven} clientes={clientes} onVerTodo={() => onNav('avisos')} />
          </div>
        </div>
      ) : (
        <>
          {tarjetaActual}
          {restoDelDia}
          <ParaMandarFila pedidos={pedidosParaMandar.length} recordatorios={recordatorios.length} tituloDia={dia.titulo} vuelven={vuelven.length} onIr={() => onNav('avisos')} />
        </>
      )}
    </section>
  );
}
