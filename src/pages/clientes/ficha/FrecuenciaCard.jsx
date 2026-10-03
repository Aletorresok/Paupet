import Icon from '../../../components/ui/Icon';
import { PAUSA_SIEMPRE, calcFrecuencia, enPausa, fmtCada, fmtRestantes } from '../../../lib/frecuencia';
import { C } from '../../../lib/styles';
import { fmtFecha, todayStr } from '../../../lib/utils';

const TONOS = {
  al_dia:  { bg: C.mentaSuave, fg: '#173F31' },
  pronto:  { bg: C.ambarSuave, fg: '#5E3900' },
  vencido: { bg: C.rosaSuave,  fg: '#7A2240' },
};

// Aviso de que Pau sacó al perro de "Ya les toca volver", con opción de deshacerlo.
function AvisoPausa({ hasta, onQuitar }) {
  return (
    <div style={{display:'flex',gap:10,alignItems:'center',background:'#F3F1EE',color:'#46524D',borderRadius:12,padding:'8px 14px',fontSize:14,flexWrap:'wrap'}}>
      <span style={{flex:1,minWidth:200}}>
        {hasta === PAUSA_SIEMPRE ? 'No se te recuerda que tiene que volver.' : `No aparece en "Ya les toca volver" hasta el ${fmtFecha(hasta)}.`}
      </span>
      <button type="button" onClick={onQuitar} style={{minHeight:36,border:'none',background:'none',color:C.verde,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer'}}>Volver a mostrar</button>
    </div>
  );
}

// Frecuencia de vuelta + próximo turno (si ya tiene uno) o botón para agendarlo.
export default function FrecuenciaCard({ cliente, proximoTurno, onAgendar, onQuitarPausa }) {
  const tarjeta = <FrecuenciaInfo cliente={cliente} proximoTurno={proximoTurno} onAgendar={onAgendar} />;
  if (!onQuitarPausa || !enPausa(cliente)) return tarjeta;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {tarjeta}
      <AvisoPausa hasta={cliente.vuelta_pausa} onQuitar={onQuitarPausa} />
    </div>
  );
}

function FrecuenciaInfo({ cliente, proximoTurno, onAgendar }) {
  const f = calcFrecuencia(cliente.visitas);
  if (proximoTurno) {
    return (
      <div style={{display:'flex',gap:10,alignItems:'center',background:C.mentaSuave,color:'#173F31',borderRadius:12,padding:'12px 14px',fontSize:14}}>
        <Icon name="calendar"/>
        <span style={{flex:1}}>Próximo turno: <strong>{fmtFecha(proximoTurno.fecha)} a las {proximoTurno.hora}</strong>{f ? ` · viene cada ${fmtCada(f.cadaDias)}` : ''}</span>
      </div>
    );
  }
  if (!f) {
    return (
      <div style={{display:'flex',gap:10,alignItems:'center',background:'#F3F1EE',color:'#46524D',borderRadius:12,padding:'12px 14px',fontSize:14}}>
        <Icon name="repeat"/>
        <span style={{flex:1}}>Con dos visitas o más te muestro cada cuánto viene.</span>
        <button type="button" onClick={() => onAgendar(todayStr())} style={{border:'none',background:'none',color:C.verde,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer'}}>Dar turno</button>
      </div>
    );
  }
  const t = TONOS[f.estado];
  const sugerida = f.proxima < todayStr() ? todayStr() : f.proxima;
  return (
    <div style={{display:'flex',gap:10,alignItems:'center',background:t.bg,color:t.fg,borderRadius:12,padding:'12px 14px',fontSize:14,flexWrap:'wrap'}}>
      <Icon name="repeat"/>
      <span style={{flex:1,minWidth:200}}>
        <strong>Viene cada {fmtCada(f.cadaDias)}.</strong> Próxima vuelta estimada: {fmtFecha(f.proxima)} · <strong>{fmtRestantes(f)}</strong>
      </span>
      <button type="button" onClick={() => onAgendar(sugerida)} style={{height:36,padding:'0 14px',borderRadius:10,border:'none',background:C.menta,color:C.sobreMenta,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer'}}>Agendar</button>
    </div>
  );
}
