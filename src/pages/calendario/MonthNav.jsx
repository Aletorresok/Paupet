import { useResp } from '../../context/resp';
import { MESES } from '../../lib/constants';
import { serif } from '../../lib/styles';

const arrowBtn = {background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'};

export default function MonthNav({ year, month, onChange }) {
  const { isMob } = useResp();
  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <button onClick={()=>onChange(-1)} style={arrowBtn}>‹</button>
      <span style={{fontFamily:serif,fontSize:isMob?18:20,fontWeight:600,minWidth:150,textAlign:'center'}}>
        {MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} {year}
      </span>
      <button onClick={()=>onChange(1)} style={arrowBtn}>›</button>
    </div>
  );
}
