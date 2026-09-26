import { columnasHoras, etiquetaDia, letraHoras } from './storyLayout';

// Recuadro de un día para los diseños Nuevo / Menta / Crema / Salchicha.
// Tiene alto fijo (lo reparte el diseño) y acomoda los horarios libres en una grilla con la letra
// más grande que entre. Si el recuadro es alto, el día va arriba; si es bajo, a la izquierda.
// `tema` = { fondo, etiqueta, texto, apagado, radio, sombra }.
export default function StoryDiaFlex({ dia, ancho, alto, tema }) {
  const libres = dia.horas.filter(h => !dia.tomados.includes(h));
  const arriba = alto >= 92;
  const padX = arriba ? 16 : 14, padY = arriba ? 10 : 6;
  const labelW = arriba ? 0 : 70;
  const labelH = arriba ? Math.min(38, Math.round(alto * 0.22)) : 0;
  const areaW = ancho - padX * 2 - (arriba ? 0 : labelW + 10);
  const areaH = alto - padY * 2 - labelH;
  const cols = columnasHoras(libres.length, areaW);
  const filas = Math.max(1, Math.ceil(libres.length / cols));
  const letra = letraHoras(libres.length, areaW, areaH);
  const letraDia = arriba ? Math.max(14, Math.min(24, Math.round(labelH * 0.6))) : 15;

  return (
    <div style={{
      height:alto,width:ancho,boxSizing:'border-box',flexShrink:0,background:tema.fondo,borderRadius:tema.radio,
      boxShadow:tema.sombra,padding:`${padY}px ${padX}px`,display:'flex',flexDirection:arriba?'column':'row',
      alignItems:arriba?'stretch':'center',gap:arriba?0:10,overflow:'hidden',
    }}>
      <span style={{
        width:arriba?'auto':labelW,height:arriba?labelH:'auto',flexShrink:0,display:'flex',alignItems:'center',
        justifyContent:arriba?'center':'flex-start',fontSize:letraDia,fontWeight:700,textTransform:'uppercase',
        letterSpacing:'.06em',color:tema.etiqueta,lineHeight:1,
      }}>
        {etiquetaDia(dia.date, arriba)}
      </span>
      {libres.length ? (
        <div style={{
          flex:1,minHeight:0,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gridTemplateRows:`repeat(${filas},1fr)`,
          alignItems:'center',justifyItems:'center',columnGap:8,
        }}>
          {libres.map(h => (
            <span key={h} style={{fontSize:letra,fontWeight:700,color:tema.texto,lineHeight:1,whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{h}</span>
          ))}
        </div>
      ) : (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.min(22, Math.max(15, Math.round(areaH * 0.4))),fontWeight:500,color:tema.apagado,fontStyle:'italic'}}>
          Completo
        </div>
      )}
    </div>
  );
}
