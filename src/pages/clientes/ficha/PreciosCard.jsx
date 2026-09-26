import { C } from '../../../lib/styles';
import { diasDesde, fmtPeso } from '../../../lib/utils';
import { resumenPrecios } from './precios';

const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fechaCorta = f => { const [y, m] = f.split('-'); return `${MES_CORTO[Number(m) - 1]} ${y.slice(2)}`; };
const hace = dias => dias < 45 ? `hace ${dias} días` : `hace ${Math.round(dias / 30)} meses`;

// Mini gráfico del precio cobrado (sólo informativo: el precio se sigue poniendo a mano).
export default function PreciosCard({ visitas }) {
  const r = resumenPrecios(visitas);
  if (!r) return <p style={{fontSize:14,color:C.tintaSuave,margin:0}}>Con dos visitas o más del mismo servicio se ve cómo fue cambiando el precio.</p>;
  const W = 280, H = 64, pad = 6;
  const precios = r.serie.map(v => v.precio);
  const min = Math.min(...precios), max = Math.max(...precios);
  const x = i => pad + i * (W - 2 * pad) / (r.serie.length - 1);
  const y = p => max === min ? H / 2 : H - pad - (p - min) / (max - min) * (H - 2 * pad);
  const puntos = r.serie.map((v, i) => `${x(i)},${y(v.precio)}`).join(' ');
  const diasAumento = r.ultimoAumento ? diasDesde(r.ultimoAumento.fecha) : null;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:13,color:C.tintaSuave}}>{r.servicio} · últimas {r.serie.length} veces</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Precio de ${r.servicio}: de ${fmtPeso(r.primero.precio)} a ${fmtPeso(r.ultimo.precio)}`}>
        <polyline points={puntos} fill="none" stroke={C.mentaBorde} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {r.serie.map((v, i) => (
          <circle key={v.id ?? i} cx={x(i)} cy={y(v.precio)} r={i === r.serie.length - 1 ? 4 : 2.5} fill={i === r.serie.length - 1 ? C.verde : C.mentaBorde}>
            <title>{`${fechaCorta(v.fecha)}: ${fmtPeso(v.precio)}`}</title>
          </circle>
        ))}
      </svg>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.tintaSuave}}>
        <span>{fechaCorta(r.primero.fecha)} · {fmtPeso(r.primero.precio)}</span>
        <span><strong style={{color:C.tinta}}>{fmtPeso(r.ultimo.precio)}</strong> · {fechaCorta(r.ultimo.fecha)}</span>
      </div>
      <div style={{fontSize:13}}>
        {r.variacion !== 0 && <span>{r.variacion > 0 ? '+' : ''}{r.variacion}% en el período. </span>}
        {diasAumento !== null
          ? <span style={{color: diasAumento > 150 ? C.ambar : C.tintaSuave}}>Último aumento {hace(diasAumento)}.</span>
          : <span style={{color:C.ambar}}>Siempre se le cobró lo mismo.</span>}
      </div>
    </div>
  );
}
