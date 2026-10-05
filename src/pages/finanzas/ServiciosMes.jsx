import { C } from '../../lib/styles';
import { MES_CORTO } from './finanzasCalc';

// Con menos días el ritmo del mes todavía no dice nada y el porcentaje asusta.
const DIAS_PARA_COMPARAR = 10;

const unDecimal = n => (Math.round(n * 10) / 10).toLocaleString('es-AR');
const corto = m => `${MES_CORTO[Number(m.slice(5)) - 1]}${m.slice(0, 4) !== String(new Date().getFullYear()) ? ` ${m.slice(0, 4)}` : ''}`;
const rango = meses => meses.length === 1 ? corto(meses[0]) : `${corto(meses[0])} a ${corto(meses[meses.length - 1])}`;

function Comparacion({ titulo, c, porSemana, dias }) {
  if (!c) return (
    <div style={{flex:'1 1 180px',border:`1px solid ${C.linea}`,borderRadius:12,padding:'10px 12px'}}>
      <div style={{fontSize:13,color:C.tintaSuave}}>{titulo}</div>
      <div style={{fontSize:14,color:C.tintaSuave,marginTop:4}}>Sin servicios para comparar</div>
    </div>
  );
  if (dias < DIAS_PARA_COMPARAR) return (
    <div style={{flex:'1 1 180px',border:`1px solid ${C.linea}`,borderRadius:12,padding:'10px 12px'}}>
      <div style={{fontSize:13,color:C.tintaSuave}}>{titulo}</div>
      <div style={{fontSize:14,color:C.tinta,marginTop:4}}>Ahí venían {unDecimal(c.porSemana)} por semana</div>
      <div style={{fontSize:12,color:C.tintaSuave}}>El porcentaje aparece desde el día {DIAS_PARA_COMPARAR}</div>
    </div>
  );
  const color = c.variacion > 0 ? C.verde : c.variacion < 0 ? C.rosa : C.tinta;
  return (
    <div style={{flex:'1 1 180px',border:`1px solid ${C.linea}`,borderRadius:12,padding:'10px 12px'}}>
      <div style={{fontSize:13,color:C.tintaSuave}}>{titulo}</div>
      <div style={{fontSize:22,fontWeight:600,color,lineHeight:1.2}}>{c.variacion > 0 ? '+' : ''}{c.variacion}%</div>
      <div style={{fontSize:12,color:C.tintaSuave}}>{unDecimal(porSemana)} por semana contra {unDecimal(c.porSemana)}</div>
    </div>
  );
}

// El total de servicios del mes bien grande, de qué tipo fueron y cómo viene comparado por semana.
export default function ServiciosMes({ r, tipos, onVer }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <button type="button" onClick={onVer} style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap',border:'none',background:'transparent',padding:0,font:'inherit',color:C.tinta,textAlign:'left',cursor:'pointer'}}>
        <span style={{fontSize:44,fontWeight:600,letterSpacing:'-.02em',lineHeight:1}}>{r.servicios}</span>
        <span style={{fontSize:16,fontWeight:600}}>servicios</span>
        <span style={{fontSize:14,color:C.tintaSuave}}>· {unDecimal(r.porSemana)} por semana{r.dias < 28 ? ` (van ${r.dias} ${r.dias === 1 ? 'día' : 'días'})` : ''}</span>
      </button>
      {!!tipos.length && (
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {tipos.map(t => (
            <span key={t.nombre} style={{background:'#F7F4EF',borderRadius:999,padding:'5px 12px',fontSize:14}}>
              <strong>{t.cantidad}</strong> {t.nombre}
            </span>
          ))}
        </div>
      )}
      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
        <Comparacion titulo={r.trimestre ? `vs ${rango(r.trimestre.meses)}` : 'vs los 3 meses anteriores'} c={r.trimestre} porSemana={r.porSemana} dias={r.dias} />
        <Comparacion titulo={r.anioPasado ? `vs ${rango(r.anioPasado.meses)}` : 'vs el mismo mes del año pasado'} c={r.anioPasado} porSemana={r.porSemana} dias={r.dias} />
      </div>
    </div>
  );
}
