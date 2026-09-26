import { useResp } from '../../context/resp';
import { C } from '../../lib/styles';

const COLOR = { confirmed: C.menta, pending: '#C98A1B', completed: '#B9C2BE' };
const MAX = 3;

// Un día de la vista Mes. En escritorio muestra hora y perro de los primeros turnos;
// en el celular, la cantidad y un punto por estado.
export default function CalendarDay({ day, turnos, isToday, isSel, onClick }) {
  const { w } = useResp();
  // Con celdas angostas (celular o tablet con el panel del día al lado) va la versión compacta.
  const isMob = w < 1180;
  const lista = [...turnos].sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
  const activos = lista.filter(t => t.estado !== 'completed').length;
  return (
    <button type="button" onClick={onClick} aria-pressed={isSel}
      aria-label={`${day}: ${lista.length ? `${lista.length} turno${lista.length === 1 ? '' : 's'}` : 'sin turnos'}`}
      style={{
        minHeight:isMob?52:84,borderRadius:10,padding:isMob?'4px 3px':'6px 6px',textAlign:'left',fontFamily:'inherit',
        display:'flex',flexDirection:'column',gap:3,minWidth:0,cursor:'pointer',color:C.tinta,
        background:isSel?C.mentaSuave:'white',
        border:`1.5px solid ${isSel?C.mentaBorde:isToday?C.menta:C.linea}`,
      }}>
      <span style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2}}>
        <span style={{fontSize:12,fontWeight:600,...(isToday?{background:C.menta,color:C.sobreMenta,width:20,height:20,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center'}:{})}}>{day}</span>
        {isMob && lista.length > 0 && <span style={{fontSize:11,fontWeight:600,color:activos ? C.verde : C.tintaSuave}}>{lista.length}</span>}
      </span>
      {isMob ? (
        <span style={{display:'flex',gap:2,flexWrap:'wrap'}}>
          {lista.slice(0, 4).map(t => <span key={t.id} style={{width:6,height:6,borderRadius:'50%',background:COLOR[t.estado] || COLOR.pending}}/>)}
        </span>
      ) : (
        <>
          {lista.slice(0, MAX).map(t => (
            <span key={t.id} title={`${t.hora || 'sin hora'} · ${t.dogName || ''} · ${t.servicio || ''}`}
              style={{display:'block',fontSize:11,lineHeight:'16px',padding:'0 4px',borderRadius:4,borderLeft:`3px solid ${COLOR[t.estado] || COLOR.pending}`,
                background:'#F7F4EF',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',opacity:t.estado==='completed'?.6:1}}>
              {t.hora && <strong style={{fontWeight:600}}>{t.hora} </strong>}{t.dogName || '—'}
            </span>
          ))}
          {lista.length > MAX && <span style={{fontSize:11,color:C.tintaSuave,paddingLeft:4}}>+{lista.length - MAX} más</span>}
        </>
      )}
    </button>
  );
}
