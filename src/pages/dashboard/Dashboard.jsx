import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import { DIAS_ES, MESES } from '../../lib/constants';
import { clientesParaVolver } from '../../lib/frecuencia';
import { C } from '../../lib/styles';
import { fmtPeso, toISODate, todayStr } from '../../lib/utils';
import { calcResumenMes, proximoTurno } from './dashboardStats';
import KpiCard from './KpiCard';
import ProximoTurnoCard from './ProximoTurnoCard';
import AgendaHoyCard from './AgendaHoyCard';
import ManianaCard from './ManianaCard';
import VuelvenCard from './VuelvenCard';
import InasistenciasCard from './InasistenciasCard';
import RecordatorioRespaldo from './RecordatorioRespaldo';

const saludo = h => h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';

export default function Dashboard({ clientes, turnos, notas, onNav, onOpenClient, onNuevoTurno, onCompletar, onNoVino, onEditTurno }) {
  const { isMob, isTab } = useResp();
  const hoy = new Date();
  const hoyISO = todayStr();
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
  const mananaISO = toISODate(manana);

  const turnosHoy = turnos.filter(t => t.fecha === hoyISO);
  const quedan = turnosHoy.filter(t => t.estado !== 'completed').length;
  const turnosManana = turnos.filter(t => t.fecha === mananaISO && t.estado !== 'completed');
  const pendientes = turnos.filter(t => t.estado === 'pending' && t.fecha >= hoyISO).length;
  const proximo = proximoTurno(turnosHoy, hoy);
  const res = calcResumenMes(clientes, notas, hoy);
  const vuelven = clientesParaVolver(clientes, turnos);
  const conInasistencias = clientes.filter(c => c.inasistencias > 0).sort((a,b) => b.inasistencias-a.inasistencias);
  const mes = MESES[hoy.getMonth()];

  const titulo = quedan === 0 ? `${saludo(hoy.getHours())}.` : `${saludo(hoy.getHours())}. Hoy ${quedan === 1 ? 'queda 1 turno' : `quedan ${quedan} turnos`}.`;

  return (
    <section>
      <PageHeader title={titulo} subtitle={`${DIAS_ES[hoy.getDay()]} ${hoy.getDate()} de ${mes}`}>
        {!isMob && <Btn onClick={onNuevoTurno}><Icon name="plus" strokeWidth={2}/>Nuevo turno</Btn>}
      </PageHeader>

      <RecordatorioRespaldo onIr={() => onNav('config')} />

      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob ? 2 : 4},minmax(0,1fr))`,gap:isMob?10:16,marginBottom:20}}>
        <KpiCard label={`Ingresos de ${mes}`} valor={fmtPeso(res.ingresos)} detalle={`Efectivo ${fmtPeso(res.efectivo)} · Transf. ${fmtPeso(res.transferencia)}`} />
        <KpiCard oscuro label="Ganancia neta" valor={fmtPeso(res.ganancia)} detalle={`Gastos ${fmtPeso(res.egresos)}`} />
        <KpiCard label="Servicios del mes" valor={res.servicios} detalle={`Ticket promedio ${fmtPeso(res.ticket)}`} />
        <KpiCard label="Sin confirmar" valor={pendientes} detalle={pendientes ? 'turnos pendientes' : 'todo confirmado'} tono={pendientes ? C.ambar : undefined} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob||isTab?'1fr':'minmax(0,1.55fr) minmax(0,1fr)',gap:20,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:20,minWidth:0}}>
          <ProximoTurnoCard
            proximo={proximo}
            cliente={proximo ? (clientes.find(c => c.id === proximo.turno.clientId) || {}) : {}}
            onCompletar={onCompletar} onNoVino={onNoVino} onEditTurno={onEditTurno}
          />
          <AgendaHoyCard turnos={turnosHoy} clientes={clientes} onCompletar={onCompletar} onEditTurno={onEditTurno} onVerAgenda={()=>onNav('calendario')} />
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:20,minWidth:0}}>
          <VuelvenCard items={vuelven} onOpenClient={onOpenClient} />
          <ManianaCard turnos={turnosManana} clientes={clientes} />
          <InasistenciasCard clientes={conInasistencias} />
        </div>
      </div>
    </section>
  );
}
