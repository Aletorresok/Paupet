import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import { DIAS_ES, MESES } from '../../lib/constants';
import { todayStr } from '../../lib/utils';
import { calcDashboardStats } from './dashboardStats';
import StatCard from './StatCard';
import TurnosHoyCard from './TurnosHoyCard';
import InasistenciasCard from './InasistenciasCard';
import VuelvenCard from './VuelvenCard';
import { clientesParaVolver } from '../../lib/frecuencia';

export default function Dashboard({ clientes, turnos, onNav, onOpenClient, onCompletar, onNoVino, onEditTurno }) {
  const { isMob, isTab } = useResp();
  const hoy = new Date();
  const hoyISO = todayStr();
  const hoyTurnos = turnos.filter(t => t.fecha === hoyISO && t.estado !== 'completed');
  const conInasistencias = clientes.filter(c => c.inasistencias > 0).sort((a,b) => b.inasistencias-a.inasistencias);
  const stats = calcDashboardStats(clientes, turnos, hoy);
  const vuelven = clientesParaVolver(clientes, turnos);

  return (
    <section>
      <PageHeader
        title="Panel de Control 🌸"
        subtitle={`${DIAS_ES[hoy.getDay()]}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`}
        titleStyle={{lineHeight:1.1}}
      >
        <Btn onClick={() => onNav('calendario')} size={isMob?'sm':''}>+ Nuevo turno</Btn>
      </PageHeader>

      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob ? 2 : 4},1fr)`,gap:12,marginBottom:20}}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':(isTab?'1fr':'1.4fr 1fr'),gap:16}}>
        <TurnosHoyCard turnos={hoyTurnos} clientes={clientes} onCompletar={onCompletar} onNoVino={onNoVino} onEditTurno={onEditTurno} />
        <div style={{display:'flex',flexDirection:'column',gap:16,minWidth:0}}>
          <VuelvenCard items={vuelven} onOpenClient={onOpenClient} />
          <InasistenciasCard clientes={conInasistencias} />
        </div>
      </div>
    </section>
  );
}
