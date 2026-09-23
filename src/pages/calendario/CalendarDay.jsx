import { useResp } from '../../context/resp';

const estadoColor = e => e==='confirmed'?'#5fbf9b':e==='pending'?'#e8809a':'#9a9090';

export default function CalendarDay({ day, turnos, isToday, isSel, onClick }) {
  const { isMob } = useResp();
  const hasApt = turnos.length > 0;
  return (
    <div onClick={onClick} style={{
      minHeight:isMob?44:60,borderRadius:8,padding:isMob?'4px 3px':'6px 7px',
      background:isSel?'#dff5ec':isToday?'#f0faf7':'white',
      border:`1.5px solid ${isSel?'#3a9b7b':isToday?'#5fbf9b':hasApt?'#f7bfcb':'transparent'}`,
      cursor:'pointer',transition:'all .15s',
    }}>
      <div style={{fontSize:11,fontWeight:500,marginBottom:2,...(isToday?{background:'#5fbf9b',color:'white',width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}:{})}}>{day}</div>
      <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
        {turnos.slice(0,isMob?2:4).map((t,i)=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:estadoColor(t.estado)}}/>)}
      </div>
    </div>
  );
}
