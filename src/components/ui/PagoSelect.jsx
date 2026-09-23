import { inputStyle } from '../../lib/styles';

export default function PagoSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}>
      <option value="efectivo">💵 Efectivo</option>
      <option value="transferencia">📱 Transferencia</option>
    </select>
  );
}
