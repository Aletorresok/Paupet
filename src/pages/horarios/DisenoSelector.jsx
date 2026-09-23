import Btn from '../../components/ui/Btn';
import { DISENOS } from './disenoStorage';

export default function DisenoSelector({ value, onChange }) {
  return (
    <div role="group" aria-label="Diseño de la imagen" style={{display:'flex',gap:6,marginLeft:'auto',flexWrap:'wrap'}}>
      {DISENOS.map(d => (
        <Btn key={d.id} size="sm" variant={value===d.id?'primary':'ghost'} onClick={()=>onChange(d.id)}>{d.label}</Btn>
      ))}
    </div>
  );
}
