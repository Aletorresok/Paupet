import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import Seccion from '../clientes/ficha/Seccion';
import KpiCard from '../dashboard/KpiCard';
import { C } from '../../lib/styles';
import { fmtPeso, todayStr } from '../../lib/utils';
import { agendadoPorCobrar, calcResumenMes, ingresosHastaDia, csvDelMes, descargarCsv, gastosPorCategoria, mesActual, moverMes, serieMeses, serviciosPorDia, topServicios } from './finanzasCalc';
import { estadoClientes } from './estadoClientes';
import ClientelaStats from './ClientelaStats';
import { COL } from './colores';
import MesNav from './MesNav';
import BarrasMeses from './BarrasMeses';
import PagoSplit from './PagoSplit';
import BarrasRanking from './BarrasRanking';
import ComprasPendientes from './ComprasPendientes';

const variacion = (actual, anterior, texto = 'vs mes anterior') => {
  if (!anterior) return null;
  const p = Math.round((actual - anterior) / anterior * 100);
  return `${p >= 0 ? '+' : ''}${p}% ${texto}`;
};

export default function FinanzasPage({ clientes, notas, turnos = [], onNuevoGasto, onNav }) {
  const { isMob, isTab } = useResp();
  const [mes, setMes] = useState(mesActual);
  const r = calcResumenMes(clientes, notas, mes);
  const prev = calcResumenMes(clientes, notas, moverMes(mes, -1));
  const serie = serieMeses(clientes, notas, mes, isMob ? 4 : 6);
  const top = topServicios(clientes, mes).map(s => ({ nombre: s.nombre, detalle: `${s.cantidad}`, monto: s.monto }));
  const gastos = gastosPorCategoria(notas, mes).map(g => ({ nombre: g.categoria, monto: g.monto }));
  const margen = r.ingresos ? Math.round(r.ganancia / r.ingresos * 100) : 0;
  const agendado = agendadoPorCobrar(turnos, mes, todayStr());
  // En el mes en curso se compara contra el mes pasado hasta el mismo día (no contra el mes entero).
  const enCurso = mes === mesActual();
  const diaHoy = new Date().getDate();
  const varIngresos = enCurso
    ? variacion(r.ingresos, ingresosHastaDia(clientes, moverMes(mes, -1), diaHoy), `vs el ${diaHoy} del mes pasado`)
    : variacion(r.ingresos, prev.ingresos);
  const porDia = serviciosPorDia(clientes, mes).map(d => ({ nombre: d.nombre, detalle: `${d.cantidad} servicios`, monto: d.monto }));
  const clientela = estadoClientes(clientes, mes);

  return (
    <section>
      <PageHeader title="Finanzas" subtitle="Cómo viene el negocio">
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <MesNav mes={mes} onChange={setMes} />
          <Btn variant="ghost" onClick={() => descargarCsv(csvDelMes(clientes, notas, mes), `paupet_${mes}.csv`)}><Icon name="download"/>{isMob ? 'CSV' : 'Exportar CSV'}</Btn>
          <Btn variant="ghost" onClick={onNuevoGasto}><Icon name="plus" strokeWidth={2}/>Registrar gasto</Btn>
        </div>
      </PageHeader>

      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob ? 2 : 4},minmax(0,1fr))`,gap:isMob?10:16,marginBottom:20}}>
        <KpiCard label="Ingresos" valor={fmtPeso(r.ingresos)} detalle={varIngresos || `${r.servicios} servicios`} />
        <KpiCard label="Gastos" valor={fmtPeso(r.egresos)} detalle={gastos[0] ? `Mayor: ${gastos[0].nombre}` : 'Sin gastos cargados'} />
        <KpiCard oscuro label="Ganancia neta" valor={fmtPeso(r.ganancia)} detalle={r.ingresos ? `${margen}% de lo que entró` : '—'} />
        <KpiCard label="Ticket promedio" valor={fmtPeso(r.ticket)} detalle={`${r.servicios} servicios`} />
      </div>

      {agendado.cantidad > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',background:C.mentaSuave,color:'#173F31',borderRadius:14,padding:'12px 16px',marginTop:-6,marginBottom:20,fontSize:14}}>
          <Icon name="calendar" />
          <span style={{flex:1,minWidth:200}}>
            Quedan <strong>{agendado.cantidad} turnos agendados</strong> este mes por <strong>{fmtPeso(agendado.monto)}</strong>.
            {' '}Si se cumplen, el mes cierra en <strong>{fmtPeso(r.ingresos + agendado.monto)}</strong> de ingresos.
          </span>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:isMob||isTab?'1fr':'minmax(0,1.5fr) minmax(0,1fr)',gap:20,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:20,minWidth:0}}>
          <Seccion titulo={`Últimos ${serie.length} meses`}>
            <BarrasMeses serie={serie} mesSel={mes} onSelectMes={setMes} />
          </Seccion>
          <Seccion titulo="Cómo te pagan">
            <PagoSplit efectivo={r.efectivo} transferencia={r.transferencia} />
          </Seccion>
          <Seccion titulo="Clientela">
            <ClientelaStats e={clientela} />
          </Seccion>
          <Seccion titulo="Qué días rinden más" extra={<span style={{fontSize:12,color:C.tintaSuave}}>últimos 3 meses</span>}>
            <BarrasRanking items={porDia} color={COL.ingresos} vacio="Todavía no hay servicios." />
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
