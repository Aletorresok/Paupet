import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import Seccion from '../clientes/ficha/Seccion';
import KpiCard from '../dashboard/KpiCard';
import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { calcResumenMes, csvDelMes, descargarCsv, gastosPorCategoria, mesActual, moverMes, serieMeses, topServicios } from './finanzasCalc';
import { COL } from './colores';
import MesNav from './MesNav';
import BarrasMeses from './BarrasMeses';
import PagoSplit from './PagoSplit';
import BarrasRanking from './BarrasRanking';
import ComprasPendientes from './ComprasPendientes';

const variacion = (actual, anterior) => {
  if (!anterior) return null;
  const p = Math.round((actual - anterior) / anterior * 100);
  return `${p >= 0 ? '+' : ''}${p}% vs mes anterior`;
};

export default function FinanzasPage({ clientes, notas, onNuevoGasto, onNav }) {
  const { isMob, isTab } = useResp();
  const [mes, setMes] = useState(mesActual);
  const r = calcResumenMes(clientes, notas, mes);
  const prev = calcResumenMes(clientes, notas, moverMes(mes, -1));
  const serie = serieMeses(clientes, notas, mes, isMob ? 4 : 6);
  const top = topServicios(clientes, mes).map(s => ({ nombre: s.nombre, detalle: `${s.cantidad}`, monto: s.monto }));
  const gastos = gastosPorCategoria(notas, mes).map(g => ({ nombre: g.categoria, monto: g.monto }));
  const margen = r.ingresos ? Math.round(r.ganancia / r.ingresos * 100) : 0;

  return (
    <section>
      <PageHeader title="Finanzas" subtitle="Cómo viene el negocio">
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <MesNav mes={mes} onChange={setMes} />
          <Btn variant="ghost" onClick={() => descargarCsv(csvDelMes(clientes, notas, mes), `paupet_${mes}.csv`)}><Icon name="download"/>{isMob ? 'CSV' : 'Exportar CSV'}</Btn>
          <Btn onClick={onNuevoGasto}><Icon name="plus" strokeWidth={2}/>Registrar gasto</Btn>
        </div>
      </PageHeader>

      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob ? 2 : 4},minmax(0,1fr))`,gap:isMob?10:16,marginBottom:20}}>
        <KpiCard label="Ingresos" valor={fmtPeso(r.ingresos)} detalle={variacion(r.ingresos, prev.ingresos) || `${r.servicios} servicios`} />
        <KpiCard label="Gastos" valor={fmtPeso(r.egresos)} detalle={gastos[0] ? `Mayor: ${gastos[0].nombre}` : 'Sin gastos cargados'} />
        <KpiCard oscuro label="Ganancia neta" valor={fmtPeso(r.ganancia)} detalle={r.ingresos ? `${margen}% de lo que entró` : '—'} />
        <KpiCard label="Ticket promedio" valor={fmtPeso(r.ticket)} detalle={`${r.servicios} servicios`} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob||isTab?'1fr':'minmax(0,1.5fr) minmax(0,1fr)',gap:20,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:20,minWidth:0}}>
          <Seccion titulo={`Últimos ${serie.length} meses`}>
            <BarrasMeses serie={serie} mesSel={mes} onSelectMes={setMes} />
          </Seccion>
          <Seccion titulo="Cómo te pagan">
            <PagoSplit efectivo={r.efectivo} transferencia={r.transferencia} />
          </Seccion>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:20,minWidth:0}}>
          <Seccion titulo="Lo que más se vende">
            <BarrasRanking items={top} color={COL.ingresos} vacio="Todavía no hay servicios este mes." />
          </Seccion>
          <Seccion titulo="En qué se gasta">
            <BarrasRanking items={gastos} color={COL.gastos} vacio="No hay gastos cargados este mes." />
          </Seccion>
          <Seccion titulo="Falta comprar">
            <ComprasPendientes notas={notas} onVerNotas={() => onNav('notas')} />
          </Seccion>
        </div>
      </div>
      <p style={{fontSize:13,color:C.tintaSuave,marginTop:16}}>Los ingresos salen de las visitas registradas; los gastos, de "Notas y gastos".</p>
    </section>
  );
}
