import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import { cardStyle } from '../../lib/styles';
import { toISODate, todayStr } from '../../lib/utils';
import MonthNav from './MonthNav';
import CalendarLegend from './CalendarLegend';
import CalendarGrid from './CalendarGrid';
import DiaTurnosPanel from './DiaTurnosPanel';
import VistaToggle from './VistaToggle';
import SemanaNav from './SemanaNav';
import AgendaSemana from './semana/AgendaSemana';
import SolapesAviso from './semana/SolapesAviso';
import DiasChips from './semana/DiasChips';
import { diasSemana, inicioSemana, layoutDia } from './semana/agendaUtils';

export default function CalendarioPage({ clientes, turnos, onAddTurno, onCompletar, onNoVino, onDelete, onConfirmar, onEditTurno }) {
  const { isMob } = useResp();
  const hoy = new Date();
  const [vista, setVista] = useState(isMob ? 'dia' : 'semana');
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [lunes, setLunes] = useState(() => inicioSemana(hoy));
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [turnoSel, setTurnoSel] = useState(null);

  const changeMonth = dir => {
    let m = month+dir, y = year;
    if (m<0){m=11;y--;} if (m>11){m=0;y++;}
    setMonth(m); setYear(y);
  };
  const cambiarSemana = dir => setLunes(l => { const d = new Date(l); d.setDate(d.getDate() + dir*7); return d; });
  const irHoy = () => { setLunes(inicioSemana(new Date())); setSelectedDay(todayStr()); };

  const dias = diasSemana(lunes, turnos);
  const isoDias = dias.map(toISODate);
  const solapes = isoDias.flatMap(iso => layoutDia(turnos.filter(t => t.fecha === iso)).solapes);
  const dayTurnos = selectedDay ? turnos.filter(t => t.fecha===selectedDay).sort((a,b) => (a.hora||'').localeCompare(b.hora||'')) : [];
  const seleccionarTurno = t => { setTurnoSel(t.id); setSelectedDay(t.fecha); };

  const opciones = isMob
    ? [{id:'dia',label:'Día'},{id:'mes',label:'Mes'}]
    : [{id:'semana',label:'Semana'},{id:'mes',label:'Mes'}];

  const panel = (
    <DiaTurnosPanel
      selectedDay={selectedDay}
      turnos={dayTurnos}
      clientes={clientes}
      onConfirmar={onConfirmar}
      onCompletar={onCompletar}
      onNoVino={onNoVino}
      onEditTurno={onEditTurno}
      onDelete={onDelete}
    />
  );

  return (
    <section>
      <PageHeader title="Agenda" subtitle={vista === 'mes' ? 'Turnos del mes' : 'Tocá un horario libre para dar un turno'}>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <VistaToggle opciones={opciones} value={vista} onChange={setVista} />
          {!isMob && <Btn onClick={() => onAddTurno(selectedDay)}><Icon name="plus" strokeWidth={2}/>Nuevo turno</Btn>}
        </div>
      </PageHeader>

      {vista !== 'mes' && (
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:14}}>
            <SemanaNav dias={dias} onCambiar={cambiarSemana} onHoy={irHoy} />
            {!isMob && <CalendarLegend />}
          </div>
          <SolapesAviso solapes={solapes} />
        </>
      )}

      {vista === 'semana' && (
        <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
          <div style={{flex:1,minWidth:0}}>
            <AgendaSemana
              dias={dias} turnos={turnos} clientes={clientes} seleccionado={turnoSel}
              onSelectTurno={seleccionarTurno}
              onSelectDia={iso => { setSelectedDay(iso); setTurnoSel(null); }}
              onNuevo={(fecha, hora) => onAddTurno(fecha, hora)}
            />
          </div>
          {panel}
        </div>
      )}

      {vista === 'dia' && (
        <>
          <DiasChips dias={dias} turnos={turnos} seleccionado={selectedDay} onSelect={setSelectedDay} />
          {panel}
        </>
      )}

      {vista === 'mes' && (
        <div style={{display:'flex',flexDirection:isMob?'column':'row',gap:16}}>
          <div style={{flex:1,...cardStyle,padding:isMob?'14px 10px':'18px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <MonthNav year={year} month={month} onChange={changeMonth} />
              {!isMob && <CalendarLegend />}
            </div>
            <CalendarGrid year={year} month={month} turnos={turnos} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </div>
          {panel}
        </div>
      )}
    </section>
  );
}
