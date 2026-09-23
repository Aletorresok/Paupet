import { MESES } from '../../lib/constants';
import { serif } from '../../lib/styles';

const arrowBtn = {background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'};

export default function SemanaNav({ semanaInicio, onChange }) {
  const fin = new Date(semanaInicio);
  fin.setDate(fin.getDate() + 5);
  const label = `${semanaInicio.getDate()} de ${MESES[semanaInicio.getMonth()]} → ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,background:'white',borderRadius:12,padding:'10px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',width:'fit-content'}}>
      <button onClick={()=>onChange(-1)} style={arrowBtn}>‹</button>
      <div style={{textAlign:'center',minWidth:180}}>
        <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,marginBottom:1}}>Semana a publicar</div>
        <div style={{fontFamily:serif,fontSize:16,fontWeight:600}}>{label}</div>
      </div>
      <button onClick={()=>onChange(1)} style={arrowBtn}>›</button>
    </div>
  );
}
