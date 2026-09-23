import { C } from '../../lib/styles';

const item = (bg, borde, label) => (
  <span style={{display:'flex',alignItems:'center',gap:6}}>
    <span style={{width:12,height:12,borderRadius:4,background:bg,border:`1.5px solid ${borde}`}}/>{label}
  </span>
);

export default function CalendarLegend() {
  return (
    <div style={{display:'flex',gap:14,fontSize:13,color:'#46524D',alignItems:'center',flexWrap:'wrap'}}>
      {item(C.mentaSuave, '#9FCDB8', 'Confirmado')}
      {item(C.ambarSuave, '#EBC98E', 'Pendiente')}
      {item('#EEF1EF', '#D5DBD8', 'Completado')}
      {item('white', C.rosa, 'Se superpone')}
    </div>
  );
}
