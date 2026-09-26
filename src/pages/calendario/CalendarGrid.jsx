import { useResp } from '../../context/resp';
import { CAL_DAYS } from '../../lib/constants';
import { todayStr } from '../../lib/utils';
import CalendarDay from './CalendarDay';

export default function CalendarGrid({ year, month, turnos, selectedDay, onSelectDay }) {
  const { isMob } = useResp();
  const todISO = todayStr();
  const first = new Date(year,month,1).getDay();
  const days  = new Date(year,month+1,0).getDate();
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:isMob?3:6}}>
      {CAL_DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:500,color:'#5B6661',padding:'6px 0',textTransform:'uppercase',letterSpacing:.4}}>{d}</div>)}
      {Array(first).fill(null).map((_,i)=><div key={'e'+i} style={{minHeight:isMob?48:84,borderRadius:10,background:'#EFEAE3',opacity:.5}}/>)}
      {Array.from({length:days},(_,i)=>i+1).map(d => {
        const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return (
          <CalendarDay
            key={d}
            day={d}
            turnos={turnos.filter(t=>t.fecha===iso)}
            isToday={iso===todISO}
            isSel={iso===selectedDay}
            onClick={()=>onSelectDay(iso)}
          />
        );
      })}
    </div>
  );
}
