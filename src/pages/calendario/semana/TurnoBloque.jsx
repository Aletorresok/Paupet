import { aHora, aMinutos } from '../../../lib/duracion';
import { C } from '../../../lib/styles';

const LOOK = {
  confirmed: { bg: C.mentaSuave, fg: '#173F31', borde: '#9FCDB8' },
  pending:   { bg: C.ambarSuave, fg: '#5E3900', borde: '#EBC98E' },
  completed: { bg: '#EEF1EF',    fg: '#46524D', borde: '#D5DBD8' },
};

// Un turno dentro de la grilla semanal: su alto es proporcional a la duración.
export default function TurnoBloque({ item, desde, pxMin, cliente, seleccionado, onClick }) {
  const { turno: t, col, cols, solapado } = item;
  const l = LOOK[t.estado] || LOOK.pending;
  const top = (aMinutos(t.hora) - desde) * pxMin;
  const alto = Math.max(22, (t.duracion || 60) * pxMin - 3);
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onClick(t); }}
      title={`${t.hora} – ${aHora(aMinutos(t.hora) + (t.duracion || 60))} · ${t.dogName || cliente.dog || ''} · ${t.servicio}`}
      style={{
        position:'absolute', top, height:alto, left:`calc(${col / cols * 100}% + 3px)`, width:`calc(${100 / cols}% - 6px)`,
        boxSizing:'border-box', borderRadius:10, padding:'4px 7px', overflow:'hidden', textAlign:'left', cursor:'pointer',
        background:l.bg, color:l.fg, fontFamily:'inherit',
        border: solapado ? `2px solid ${C.rosa}` : `1px solid ${l.borde}`,
        boxShadow: seleccionado ? `0 0 0 2px ${C.mentaBorde}` : 'none',
        display:'flex', flexDirection:'column', gap:1, opacity: t.estado === 'completed' ? .8 : 1,
      }}>
      <span style={{fontSize:11,fontWeight:600}}>{t.hora}</span>
      <span style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.dogName || cliente.dog}</span>
      {alto > 50 && <span style={{fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.servicio}</span>}
    </button>
  );
}
