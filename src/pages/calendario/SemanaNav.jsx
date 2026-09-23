import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import { MESES } from '../../lib/constants';

// Navegación entre semanas: ‹ 22 – 27 de septiembre › y botón "Hoy".
export default function SemanaNav({ dias, onCambiar, onHoy }) {
  const a = dias[0], b = dias[dias.length - 1];
  const label = a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} de ${MESES[b.getMonth()]}`
    : `${a.getDate()} de ${MESES[a.getMonth()]} – ${b.getDate()} de ${MESES[b.getMonth()]}`;
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <Btn variant="ghost" onClick={() => onCambiar(-1)} aria-label="Semana anterior" style={{width:44,padding:0}}><Icon name="left" strokeWidth={2}/></Btn>
      <span style={{fontSize:16,fontWeight:600,minWidth:200,textAlign:'center'}}>{label}</span>
      <Btn variant="ghost" onClick={() => onCambiar(1)} aria-label="Semana siguiente" style={{width:44,padding:0}}><Icon name="right" strokeWidth={2}/></Btn>
      <Btn variant="ghost" size="sm" onClick={onHoy}>Hoy</Btn>
    </div>
  );
}
