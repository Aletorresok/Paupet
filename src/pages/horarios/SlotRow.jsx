import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';

// Un horario del día. Tocar la hora lo marca tomado/libre; la X lo quita.
// `turnoDe`: nombre del perro si el horario ya tiene turno en la agenda (tomado automático, no se toca).
export default function SlotRow({ hora, tomado, turnoDe, onToggle, onRemove }) {
  const auto = !!turnoDe;
  const tono = auto ? { bg: C.ambarSuave, fg: C.ambar } : tomado ? { bg: C.rosaSuave, fg: C.rosa } : { bg: C.mentaSuave, fg: C.verde };
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,height:36,padding:'0 4px 0 10px',marginBottom:4,background:tono.bg,borderRadius:10}}>
      <button type="button" onClick={auto ? undefined : onToggle} disabled={auto}
        title={auto ? `Turno de ${turnoDe} en la agenda` : tomado ? 'Marcar disponible' : 'Marcar tomado'}
        aria-pressed={tomado}
        style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:6,background:'none',border:'none',padding:0,fontFamily:'inherit',cursor:auto?'default':'pointer',color:tono.fg,textAlign:'left'}}>
        <span style={{fontSize:14,fontWeight:600,textDecoration:tomado?'line-through':'none',fontVariantNumeric:'tabular-nums'}}>{hora}</span>
        <span style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {auto ? turnoDe : tomado ? 'tomado' : 'libre'}
        </span>
      </button>
      <button type="button" onClick={onRemove} aria-label={`Quitar ${hora}`} title="Quitar horario"
        style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',borderRadius:8,cursor:'pointer',color:C.tintaSuave}}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
