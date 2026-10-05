import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import Seccion from '../clientes/ficha/Seccion';
import KpiCard from '../dashboard/KpiCard';
import { C } from '../../lib/styles';
import { fmtFecha, fmtMes, fmtPeso, todayStr } from '../../lib/utils';
import { agendadoPorCobrar, calcResumenMes, cobrosDelMes, gastosDelMes, ritmoServicios, serviciosPorTipo, ingresosHastaDia, csvDelMes, descargarCsv, gastosPorCategoria, mesActual, moverMes, serieMeses, serviciosPorDia, topServicios } from './finanzasCalc';
import { estadoClientes, GRUPOS_CLIENTELA } from './estadoClientes';
import ClientelaStats from './ClientelaStats';
import ServiciosMes from './ServiciosMes';
import DetalleModal from './DetalleModal';
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

const sinAnio = f => fmtFecha(f).replace(/ \d{4}$/, '');
const filaCobro = (v, onOpenClient) => ({
  key: `${v.clienteId}-${v.id || v.fecha}-${v.servicio}`, titulo: `${v.dog} · ${v.servicio || 'Sin nombre'}`,
  sub: `${sinAnio(v.fecha)} · ${v.forma_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}`, monto: v.precio || 0,
  onClick: onOpenClient && v.clienteId != null ? () => onOpenClient(v.clienteId) : undefined,
});

// Arma la lista que se ve al tocar un número: de qué está hecho.
function armarDetalle(id, { mes, r, cobros, gastosMes, tipos, clientela, onOpenClient }) {
  const nombreMes = fmtMes(mes);
  const cobrosFilas = cobros.map(v => filaCobro(v, onOpenClient));
  const gastosFilas = gastosMes.map(n => ({ key: n.id || `${n.fecha}-${n.concepto}`, titulo: n.concepto || 'Gasto', sub: `${sinAnio(n.fecha)}${n.categoria ? ' · ' + n.categoria : ''}`, monto: n.monto || 0 }));
  if (id === 'ingresos') return { titulo: 'Ingresos', subtitulo: `${r.servicios} cobros de ${nombreMes}`, filas: cobrosFilas, total: { label: 'Total', monto: r.ingresos }, vacio: 'Todavía no hay cobros este mes.' };
  if (id === 'gastos') return { titulo: 'Gastos', subtitulo: nombreMes, filas: gastosFilas, total: { label: 'Total', monto: r.egresos }, vacio: 'No hay gastos cargados este mes.' };
  if (id === 'ganancia') return {
    titulo: 'Ganancia neta', subtitulo: `Lo que te queda en ${nombreMes}`,
    filas: [
      { key: 'ef', titulo: 'Cobrado en efectivo', monto: r.efectivo },
      { key: 'tr', titulo: 'Cobrado por transferencia', monto: r.transferencia },
      ...gastosFilas.map(f => ({ ...f, signo: '−' })),
    ],
    total: { label: 'Te queda', monto: r.ganancia }, vacio: '',
  };
  if (id === 'ticket') return {
    titulo: 'Ticket promedio', subtitulo: `${fmtPeso(r.ingresos)} cobrados ÷ ${r.servicios} servicios`,
    filas: tipos.map(t => ({ key: t.nombre, titulo: t.nombre, sub: `${t.cantidad} ${t.cantidad === 1 ? 'servicio' : 'servicios'} · ${fmtPeso(t.monto)}`, monto: Math.round(t.monto / t.cantidad) })),
    total: { label: 'Promedio del mes', monto: r.ticket }, vacio: 'Todavía no hay servicios este mes.',
  };
  if (id === 'servicios') return {
    titulo: 'Servicios', subtitulo: nombreMes, filas: cobrosFilas,
    total: { label: 'Total', valor: `${r.servicios} servicios` }, vacio: 'Todavía no hay servicios este mes.',
  };
  const g = GRUPOS_CLIENTELA.find(x => x.id === id);
  return {
    titulo: `${g.label}: ${clientela[id].length}`, subtitulo: g.det,
    filas: clientela[id].map(c => ({ key: c.id, titulo: c.dog, sub: c.owner, valor: `Última: ${sinAnio(c.ultima)}${c.ultima.slice(0, 4) !== mes.slice(0, 4) ? ' ' + c.ultima.slice(0, 4) : ''}`, onClick: onOpenClient ? () => onOpenClient(c.id) : undefined })),
    vacio: 'No hay ninguno.',
  };
}

export default function FinanzasPage({ clientes, notas, turnos = [], onNuevoGasto, onNav, onOpenClient }) {
  const { isMob, isTab } = useResp();
  const [mes, setMes] = useState(mesActual);
  const [verDetalle, setVerDetalle] = useState(null);
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
  const ritmo = ritmoServicios(clientes, mes, todayStr());
  const tipos = serviciosPorTipo(clientes, mes);
  const abrirFicha = onOpenClient && (id => { setVerDetalle(null); onOpenClient(id); });
  const detalle = verDetalle && armarDetalle(verDetalle, { mes, r, cobros: cobrosDelMes(clientes, mes), gastosMes: gastosDelMes(notas, mes), tipos, clientela, onOpenClient: abrirFicha });

  return (
    <section>
      <PageHeader title="Finanzas" subtitle="Cómo viene el negocio">
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <MesNav mes={mes} onChange={setMes} />
          <Btn variant="ghost" onClick={() => descargarCsv(csvDelMes(clientes, notas, mes), `paupet_${mes}.csv`)}><Icon name="download"/>{isMob ? 'CSV' : 'Exportar CSV'}</Btn>
          <Btn variant="ghost" onClick={onNuevoGasto}><Icon name="plus" strokeWidth={2}/>Registrar gasto</Btn>
        </div>
      </PageHeader>

      {/* Provisorio hasta las pestañas Mes · Año · Historial (punto 7 de REDISENO.md). */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        <Btn variant="ghost" onClick={() => onNav('historial')}><Icon name="history"/>Historial</Btn>
        <Btn variant="ghost" onClick={() => onNav('notas')}><Icon name="notes"/>Notas y gastos</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob ? 2 : 4},minmax(0,1fr))`,gap:isMob?10:16,marginBottom:20}}>
        <KpiCard label="Ingresos" valor={fmtPeso(r.ingresos)} detalle={varIngresos || `${r.servicios} servicios`} onClick={() => setVerDetalle('ingresos')} />
        <KpiCard label="Gastos" valor={fmtPeso(r.egresos)} detalle={gastos[0] ? `Mayor: ${gastos[0].nombre}` : 'Sin gastos cargados'} onClick={() => setVerDetalle('gastos')} />
        <KpiCard oscuro label="Ganancia neta" valor={fmtPeso(r.ganancia)} detalle={r.ingresos ? `${margen}% de lo que entró` : '—'} onClick={() => setVerDetalle('ganancia')} />
        <KpiCard label="Ticket promedio" valor={fmtPeso(r.ticket)} detalle={`${r.servicios} servicios`} onClick={() => setVerDetalle('ticket')} />
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
          <Seccion titulo={`Servicios de ${fmtMes(mes).split(' ')[0]}`} extra={<span style={{fontSize:12,color:C.tintaSuave}}>comparado por semana</span>}>
            <ServiciosMes r={ritmo} tipos={tipos} onVer={() => setVerDetalle('servicios')} />
          </Seccion>
          <Seccion titulo={`Últimos ${serie.length} meses`}>
            <BarrasMeses serie={serie} mesSel={mes} onSelectMes={setMes} />
          </Seccion>
          <Seccion titulo="Cómo te pagan">
            <PagoSplit efectivo={r.efectivo} transferencia={r.transferencia} />
          </Seccion>
          <Seccion titulo="Clientela">
            <ClientelaStats e={clientela} onVer={setVerDetalle} />
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
      <DetalleModal detalle={detalle} onClose={() => setVerDetalle(null)} />
      <p style={{fontSize:13,color:C.tintaSuave,marginTop:16}}>Los ingresos salen de las visitas registradas; los gastos, de "Notas y gastos".</p>
    </section>
  );
}
