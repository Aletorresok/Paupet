import Icon from '../../components/ui/Icon';
import { MESES } from '../../lib/constants';
import { C, serif } from '../../lib/styles';

const arrowBtn = {width:44,height:44,borderRadius:12,border:`1px solid ${C.linea}`,background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.tinta};

export default function SemanaNav({ semanaInicio, onChange }) {
  const fin = new Date(semanaInicio);
  fin.setDate(fin.getDate() + 5);
  const label = `${semanaInicio.getDate()} de ${MESES[semanaInicio.getMonth()]} → ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <button type="button" onClick={()=>onChange(-1)} style={arrowBtn} aria-label="Semana anterior"><Icon name="left" /></button>
      <div style={{textAlign:'center',minWidth:200}}>
        <div style={{fontSize:12,color:C.tintaSuave}}>Semana a publicar</div>
        <div style={{fontFamily:serif,fontSize:18,fontWeight:600}}>{label}</div>
      </div>
      <button type="button" onClick={()=>onChange(1)} style={arrowBtn} aria-label="Semana siguiente"><Icon name="right" /></button>
    </div>
  );
}
