import { colorEtiqueta } from '../clientes/ficha/etiquetas';
import { calcFrecuencia, fmtCada } from '../../lib/frecuencia';
import { C } from '../../lib/styles';
import { diasDesde, fmtPeso } from '../../lib/utils';
import { ultimaVisita } from './ayudaTurno';

const chip = (bg, fg) => ({display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,background:bg,color:fg,borderRadius:999,padding:'3px 10px'});

// Lo que conviene saber del perro al darle un turno: cuidados, faltas y qué se le cobró la última vez.
// `onUsarUltima(servicio, precio)` copia la última visita al formulario (el precio sigue siendo a mano).
export default function ClienteResumen({ cliente: c, onUsarUltima }) {
  if (!c) return null;
  const etiquetas = (c.etiquetas || []).filter(e => e && e.trim() && e.trim() !== 'Alergia:');
  const ultima = ultimaVisita(c);
  const frec = calcFrecuencia(c.visitas);
  const hayAlgo = etiquetas.length || c.inasistencias > 0 || c.notes || ultima;
  if (!hayAlgo) return null;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14,padding:'12px 14px',borderRadius:12,background:'white',border:`1px solid ${C.linea}`}}>
      {(etiquetas.length > 0 || c.inasistencias > 0) && (
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {c.inasistencias > 0 && <span style={chip(C.rosaSuave, C.rosa)}>Faltó {c.inasistencias} {c.inasistencias === 1 ? 'vez' : 'veces'} sin avisar</span>}
          {etiquetas.map(e => { const k = colorEtiqueta(e); return <span key={e} style={chip(k.bg, k.fg)}>{e}</span>; })}
        </div>
      )}
      {c.notes && <div style={{fontSize:13,color:C.tintaSuave}}>📝 {c.notes}</div>}
      {ultima && (
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',fontSize:13}}>
          <span style={{flex:1,minWidth:180}}>
            <strong>La última vez</strong> ({diasDesde(ultima.fecha) === 0 ? 'hoy' : `hace ${diasDesde(ultima.fecha)} días`}): {ultima.servicio} · {fmtPeso(ultima.precio)}
            {frec && <span style={{color:C.tintaSuave}}> · viene cada {fmtCada(frec.cadaDias)}</span>}
          </span>
          <button type="button" onClick={() => onUsarUltima(ultima.servicio, ultima.precio)}
            style={{height:32,padding:'0 12px',borderRadius:9,border:`1px solid ${C.mentaBorde}`,background:C.mentaSuave,color:C.verde,fontFamily:'inherit',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Usar lo mismo
          </button>
        </div>
      )}
    </div>
  );
}
