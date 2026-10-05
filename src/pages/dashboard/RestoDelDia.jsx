import PetAvatar from '../../components/ui/PetAvatar';
import { useResp } from '../../context/resp';
import { fmtDuracion } from '../../lib/duracion';
import { C, cardStyle } from '../../lib/styles';

const fila = {display:'flex',alignItems:'center',gap:12,padding:'12px 0',width:'100%',background:'none',border:'none',borderTop:'1px solid #EFECE7',fontFamily:'inherit',textAlign:'left',color:C.tinta,cursor:'pointer',minHeight:56};
const etiqueta = (bg, fg) => ({fontSize:12,fontWeight:600,color:fg,background:bg,borderRadius:999,padding:'4px 10px',flexShrink:0});

// El resto del día: los turnos que quedan después del que está en la mesa, y los huecos libres
// ("Libre 1 h 30 · dar turno", según la regla única de lib/huecosLibres.js).
export default function RestoDelDia({ turnos, huecos, clientes, onAbrirTurno, onDarTurno }) {
  const { isMob } = useResp();
  const filas = [
    ...turnos.map(t => ({ hora: t.hora || '', turno: t })),
    ...huecos.map(h => ({ hora: h.hora, hueco: h })),
  ].sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
  if (!filas.length) return null;

  return (
    <section aria-label="El resto del día" style={{...cardStyle,borderRadius:20,padding:isMob ? '6px 18px' : '8px 24px'}}>
      {filas.map(({ hora, turno: t, hueco }, i) => {
        const primera = i === 0 ? {borderTop:'none'} : null;
        if (hueco) {
          return (
            <button key={`h${hora}`} type="button" onClick={() => onDarTurno(hora)} style={{...fila,...primera}}>
              <span style={{width:isMob ? 48 : 56,fontSize:15,fontWeight:600,color:C.tintaSuave,flexShrink:0}}>{hora}</span>
              <span aria-hidden="true" style={{width:isMob ? 36 : 40,height:isMob ? 36 : 40,borderRadius:'50%',border:'1.5px dashed #9FD6C0',boxSizing:'border-box',flexShrink:0}} />
              <span style={{flex:1,minWidth:0,fontSize:15,fontWeight:600,color:C.verde}}>Libre {fmtDuracion(hueco.minutos)} · dar turno</span>
            </button>
          );
        }
        const c = clientes.find(x => x.id === t.clientId) || {};
        const pendiente = t.estado === 'pending';
        return (
          <button key={t.id} type="button" onClick={() => onAbrirTurno(t)} style={{...fila,...primera}}>
            <span style={{width:isMob ? 48 : 56,fontSize:15,fontWeight:600,flexShrink:0}}>{hora || '–'}</span>
            <PetAvatar cliente={c} size={isMob ? 36 : 40} />
            <span style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
              <span style={{fontSize:16,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.dogName || c.dog}</span>
              <span style={{fontSize:13,color:C.tintaSuave,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{[c.raza, t.servicio, c.owner].filter(Boolean).join(' · ')}</span>
            </span>
            {pendiente ? <span style={etiqueta(C.ambarSuave, '#7A4A00')}>Sin confirmar</span>
              : !isMob && <span style={etiqueta('#E4F4EC', '#1F5A44')}>Confirmado</span>}
          </button>
        );
      })}
    </section>
  );
}
