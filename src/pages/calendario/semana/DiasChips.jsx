import { C } from '../../../lib/styles';
import { toISODate } from '../../../lib/utils';

const NOMBRES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Selector de día de la semana para el celular.
export default function DiasChips({ dias, turnos, seleccionado, onSelect }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${dias.length},minmax(0,1fr))`,gap:6,marginBottom:14}}>
      {dias.map(d => {
        const iso = toISODate(d);
        const sel = iso === seleccionado;
        const cant = turnos.filter(t => t.fecha === iso).length;
        return (
          <button key={iso} type="button" aria-pressed={sel} onClick={() => onSelect(iso)} style={{
            height:58,borderRadius:12,fontFamily:'inherit',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,
            background:sel?C.menta:'white',color:sel?C.sobreMenta:C.tinta,border:sel?`1px solid ${C.mentaBorde}`:`1px solid ${C.linea}`,
          }}>
            <span style={{fontSize:12}}>{NOMBRES[d.getDay()]}</span>
            <span style={{fontSize:17,fontWeight:600}}>{d.getDate()}</span>
            <span style={{fontSize:10,fontWeight:600,color:sel?C.sobreMenta:C.tintaSuave}}>{cant ? `${cant} t.` : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
