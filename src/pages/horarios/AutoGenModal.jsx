import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import { DIAS_HOD_LABELS } from '../../lib/constants';
import { inputStyle, serif } from '../../lib/styles';

export default function AutoGenModal({ dia, form, onChange, onGenerar, onClose }) {
  const set = (k, v) => onChange(f => ({...f, [k]: v}));
  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'white',borderRadius:16,padding:24,maxWidth:340,width:'100%',boxShadow:'0 12px 40px rgba(0,0,0,.15)'}}>
        <div style={{fontFamily:serif,fontSize:18,fontWeight:600,marginBottom:16}}>Agregar varios horarios · {DIAS_HOD_LABELS[dia]}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          <FormGroup label="Desde"><input type="time" value={form.desde} onChange={e=>set('desde',e.target.value)} style={inputStyle}/></FormGroup>
          <FormGroup label="Hasta"><input type="time" value={form.hasta} onChange={e=>set('hasta',e.target.value)} style={inputStyle}/></FormGroup>
          <FormGroup label="Duración">
            <select value={form.dur} onChange={e=>set('dur',e.target.value)} style={inputStyle}>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="90">1:30 hs</option>
            </select>
          </FormGroup>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={onGenerar} style={{flex:1,justifyContent:'center'}}>Generar</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}
