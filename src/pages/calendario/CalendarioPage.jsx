import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import { cardStyle } from '../../lib/styles';
import { todayStr } from '../../lib/utils';
import MonthNav from './MonthNav';
import CalendarLegend from './CalendarLegend';
import CalendarGrid from './CalendarGrid';
import DiaTurnosPanel from './DiaTurnosPanel';

export default function CalendarioPage({ clientes, turnos, onAddTurno, onCompletar, onNoVino, onDelete, onConfirmar, onEditTurno }) {
  const { isMob } = useResp();
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [selectedDay, setSelectedDay] = useState(todayStr());

  const changeMonth = dir => {
    let m = month+dir, y = year;
    if (m<0){m=11;y--;} if (m>11){m=0;y++;}
    setMonth(m); setYear(y);
  };

  const dayTurnos = selectedDay ? turnos.filter(t => t.fecha===selectedDay) : [];

  return (
    <section>
      <PageHeader title="Agenda" subtitle="Turnos del mes">
        <Btn onClick={() => onAddTurno(selectedDay)} size={isMob?'sm':''}>+ Agregar turno</Btn>
      </PageHeader>

      <div style={{display:'flex',flexDirection:isMob?'column':'row',gap:16}}>
        <div style={{flex:1,...cardStyle,padding:isMob?'14px 10px':'18px 16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <MonthNav year={year} month={month} onChange={changeMonth} />
            {!isMob && <CalendarLegend />}
          </div>
          <CalendarGrid year={year} month={month} turnos={turnos} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </div>

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
      </div>
    </section>
  );
}
