import Icon from '../../../components/ui/Icon';
import { calcFrecuencia, fmtCada, fmtRestantes } from '../../../lib/frecuencia';
import { C } from '../../../lib/styles';
import { fmtFecha, todayStr } from '../../../lib/utils';

const TONOS = {
  al_dia:  { bg: C.mentaSuave, fg: '#173F31' },
  pronto:  { bg: C.ambarSuave, fg: '#5E3900' },
  vencido: { bg: C.rosaSuave,  fg: '#7A2240' },
};

// Frecuencia de vuelta + próximo turno (si ya tiene uno) o botón para agendarlo.
export default function FrecuenciaCard({ cliente, proximoTurno, onAgendar }) {
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
