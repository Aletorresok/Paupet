import { useResp } from '../../../context/resp';
import { C } from '../../../lib/styles';
import { fmtPeso } from '../../../lib/utils';

// Datos básicos del perro y totales.
export default function DatosPerro({ cliente: c, onRestarInasistencia }) {
  const { isMob } = useResp();
  const gastado = (c.visitas || []).reduce((s, v) => s + (v.precio || 0), 0);
  const datos = [
    ['Raza', c.raza || '–'], ['Tamaño', c.size || '–'], ['Pelaje', c.pelaje || '–'],
    ['Visitas', (c.visitas || []).length], ['Gastó en total', fmtPeso(gastado)],
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:isMob?'1fr 1fr':'repeat(3,minmax(0,1fr))',gap:'14px 12px'}}>
      {datos.map(([l, v]) => (
        <div key={l} style={{display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontSize:13,color:C.tintaSuave}}>{l}</span>
          <span style={{fontSize:16,fontWeight:600}}>{v}</span>
        </div>
      ))}
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        <span style={{fontSize:13,color:C.tintaSuave}}>Faltó sin avisar</span>
        <span style={{fontSize:16,fontWeight:600,color:c.inasistencias ? C.rosa : C.tinta,display:'flex',alignItems:'center',gap:8}}>
          {c.inasistencias || 0} {c.inasistencias === 1 ? 'vez' : 'veces'}
          {c.inasistencias > 0 && <button type="button" onClick={onRestarInasistencia} style={{fontFamily:'inherit',fontSize:12,border:`1px solid ${C.linea}`,background:'white',borderRadius:8,padding:'2px 8px',cursor:'pointer',color:C.tinta}}>Restar 1</button>}
        </span>
      </div>
    </div>
  );
}
