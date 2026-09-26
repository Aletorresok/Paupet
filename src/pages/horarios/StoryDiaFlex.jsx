import { columnasHoras, etiquetaDia, letraHoras } from './storyLayout';

// Recuadro de un día para los diseños Nuevo / Menta / Crema / Salchicha, al estilo del Clásico:
// arriba una franja de color con el día y la fecha, abajo los horarios libres sobre blanco,
// en una grilla con la letra más grande que entre. El alto lo reparte el diseño.
// `tema` = { fondo, banda, sobreBanda, texto, apagado, radio, sombra }.
export default function StoryDiaFlex({ dia, ancho, alto, tema }) {
  const libres = dia.horas.filter(h => !dia.tomados.includes(h));
  const banda = Math.max(26, Math.min(40, Math.round(alto * 0.34)));
  const letraDia = Math.max(13, Math.min(20, Math.round(banda * 0.52)));
  const padX = 14, padY = alto >= 90 ? 8 : 4;
  const areaW = ancho - padX * 2;
  const areaH = alto - banda - padY * 2;
  const cols = columnasHoras(libres.length, areaW);
  const filas = Math.max(1, Math.ceil(libres.length / cols));
  const letra = letraHoras(libres.length, areaW, areaH);

  return (
    <div style={{
      height:alto,width:ancho,boxSizing:'border-box',flexShrink:0,background:tema.fondo,borderRadius:tema.radio,
      boxShadow:tema.sombra,display:'flex',flexDirection:'column',overflow:'hidden',
    }}>
      <div style={{
        height:banda,flexShrink:0,background:tema.banda,color:tema.sobreBanda,display:'flex',alignItems:'center',
        justifyContent:'center',fontSize:letraDia,fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',lineHeight:1,
      }}>
        {etiquetaDia(dia.date, alto >= 70)}
      </div>
      {libres.length ? (
        <div style={{
          flex:1,minHeight:0,padding:`${padY}px ${padX}px`,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,
          gridTemplateRows:`repeat(${filas},1fr)`,alignItems:'center',justifyItems:'center',columnGap:8,
        }}>
          {libres.map(h => (
            <span key={h} style={{fontSize:letra,fontWeight:700,color:tema.texto,lineHeight:1,whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{h}</span>
          ))}
        </div>
      ) : (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.min(22, Math.max(14, Math.round(areaH * 0.4))),fontWeight:500,color:tema.apagado,fontStyle:'italic'}}>
          Completo
        </div>
      )}
    </div>
  );
}
