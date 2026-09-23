import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import { sans } from '../../lib/styles';

const smallInput = {border:'1.5px solid #ede8e8',borderRadius:8,padding:'6px 9px',fontFamily:sans,fontSize:12,outline:'none',background:'white'};

export default function NuevoSlotForm({ hora, dur, onHora, onDur, onAdd }) {
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'#faf8f5',borderRadius:8,padding:'10px 12px',flexWrap:'wrap'}}>
      <FormGroup label="Hora">
        <input type="time" value={hora} onChange={e=>onHora(e.target.value)} style={smallInput}/>
      </FormGroup>
      <FormGroup label="Duración">
        <select value={dur} onChange={e=>onDur(e.target.value)} style={smallInput}>
          <option value="30">30 min</option><option value="45">45 min</option>
          <option value="60">1 hora</option><option value="90">1:30 hs</option><option value="120">2 horas</option>
        </select>
      </FormGroup>
      <Btn size="sm" onClick={onAdd}>+ Agregar</Btn>
    </div>
  );
}
