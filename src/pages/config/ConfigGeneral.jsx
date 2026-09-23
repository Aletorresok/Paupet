import { useResp } from '../../context/resp';
import FormGroup from '../../components/ui/FormGroup';
import { cardStyle, inputStyle } from '../../lib/styles';

export default function ConfigGeneral({ nombre, anticip, msg, onNombre, onAnticip, onMsg }) {
  const { isMob } = useResp();
  return (
    <div style={{...cardStyle,padding:'18px 20px',marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr 1fr',gap:12}}>
        <FormGroup label="Nombre de tu peluquería"><input value={nombre} onChange={e=>onNombre(e.target.value)} style={inputStyle}/></FormGroup>
        <FormGroup label="Días de anticipación máx.">
          <select value={anticip} onChange={e=>onAnticip(e.target.value)} style={inputStyle}>
            <option value="7">1 semana</option><option value="14">2 semanas</option>
            <option value="30">1 mes</option><option value="60">2 meses</option>
          </select>
        </FormGroup>
        <FormGroup label="Mensaje de bienvenida"><input value={msg} onChange={e=>onMsg(e.target.value)} style={inputStyle}/></FormGroup>
      </div>
    </div>
  );
}
