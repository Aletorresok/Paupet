import Icon from '../../components/ui/Icon';
import { calcFrecuencia, fmtCada, fmtRestantes } from '../../lib/frecuencia';
import { fmtFecha } from '../../lib/utils';

const colores = {
  al_dia:  {bg:'#dff5ec', fg:'#2b7a5f'},
  pronto:  {bg:'#fff3e0', fg:'#9a5a00'},
  vencido: {bg:'#FBE7EC', fg:'#b83d62'},
};

export default function FrecuenciaBanner({ visitas }) {
  const f = calcFrecuencia(visitas);
  if (!f) return null;
  const c = colores[f.estado];
  return (
    <div style={{marginBottom:14,padding:'10px 14px',background:c.bg,color:c.fg,borderRadius:10,fontSize:13,display:'flex',flexWrap:'wrap',gap:'4px 12px',alignItems:'center'}}>
      <Icon name="repeat" size={16}/><strong>Viene cada {fmtCada(f.cadaDias)}</strong>
      <span>Próxima estimada: {fmtFecha(f.proxima)}</span>
      <span style={{fontWeight:600}}>{fmtRestantes(f)}</span>
    </div>
  );
}
