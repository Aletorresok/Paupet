import { pillSelectStyle } from '../../lib/styles';
import { fmtMes } from '../../lib/utils';

export default function MonthSelect({ value, onChange, months }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={pillSelectStyle}>
      <option value="">Todos los meses</option>
      {months.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
    </select>
  );
}
