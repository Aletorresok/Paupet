import { DIAS_HOD_LABELS } from '../../lib/constants';

const HEADER_H = 34;
const font = "'Trebuchet MS',sans-serif";

export default function StoryDayCard({ dia, date, horas, tomados, height, marginBottom }) {
  const slotCols = horas.length<=3?1:horas.length<=6?2:3;
  const rows = Math.ceil(horas.length/slotCols);
  const fontSize = Math.min(18,Math.max(12,Math.floor((height-HEADER_H)/rows*0.55)));
  return (
    <div style={{background:'rgba(255,255,255,0.95)',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 2px 8px rgba(0,0,0,.10)',height,flexShrink:0,marginBottom}}>
      <div style={{background:'#5aba8f',height:HEADER_H,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <span style={{fontWeight:900,fontSize:15,color:'white',letterSpacing:2,textTransform:'uppercase',fontFamily:font}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {date.getDate()}</span>
      </div>
      <div style={{flex:1,padding:'4px 16px',display:'grid',gridTemplateColumns:`repeat(${slotCols},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`,gap:'0px 8px',overflow:'hidden'}}>
        {horas.map(h => {
          const esTomado = tomados.includes(h);
          return (
            <div key={h} style={{fontSize,fontWeight:700,color:esTomado?'#b8b8b8':'#1a1a1a',textDecoration:esTomado?'line-through':'none',fontFamily:font,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
              <span style={{color:'#5aba8f',fontWeight:900,fontSize:fontSize+2}}>•</span>{h} hs
            </div>
          );
        })}
      </div>
    </div>
  );
}
