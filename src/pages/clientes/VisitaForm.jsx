import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import FormGroup from '../../components/ui/FormGroup';
import { inputStyle } from '../../lib/styles';
import PagoSelect from '../../components/ui/PagoSelect';

// Formulario controlado para crear/editar una visita. `values` = {svc, precio, fecha, formaPago}.
export default function VisitaForm({ values, onChange, isEdit, onSave, onCancel }) {
  const { isMob } = useResp();
  const set = (k, v) => onChange({ ...values, [k]: v });
  const grid = {display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginBottom:10};
  return (
    <div style={{background:'#dff5ec',borderRadius:10,padding:14,marginTop:10}}>
      <div style={{fontSize:12,fontWeight:600,color:'#1F5A45',marginBottom:10}}>
        {isEdit ? 'Editar visita' : '+ Nueva visita'}
      </div>
      <div style={grid}>
        <FormGroup label="Servicio"><input value={values.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
        <FormGroup label="Precio"><input type="number" value={values.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
      </div>
      <div style={grid}>
        <FormGroup label="Fecha"><input type="date" value={values.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        <FormGroup label="Forma de pago"><PagoSelect value={values.formaPago} onChange={v=>set('formaPago',v)} /></FormGroup>
      </div>
      <div style={{display:'flex',gap:8}}>
        <Btn size="sm" onClick={onSave}><Icon name="check" size={16} strokeWidth={2}/>Guardar</Btn>
        <Btn size="sm" variant="ghost" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}
