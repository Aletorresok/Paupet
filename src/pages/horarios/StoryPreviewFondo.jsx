import { forwardRef } from 'react';
import { FONDOS } from './fondosStory';
import StoryDiaFlex from './StoryDiaFlex';
import { altoPorDia } from './storyLayout';

const TINTA = '#13302A';
const TEMA = { fondo:'rgba(255,255,255,.94)', etiqueta:'#1F5A45', texto:TINTA, apagado:'#8A948F', radio:14, sombra:'0 1px 0 rgba(19,48,42,.08)' };

// Imagen de horarios sobre un fondo ilustrado (540×960, se exporta a 1080×1920).
// Todo va dentro de la zona libre del fondo; los días se reparten ese alto (como el Clásico)
// y la letra de los horarios se ajusta a cada recuadro.
// `dias` = días activos [{dia, date, horas, tomados}]; muestra sólo los horarios libres.
const StoryPreviewFondo = forwardRef(function StoryPreviewFondo({ dias, rango, fondo = 'menta' }, ref) {
  const f = FONDOS[fondo] || FONDOS.menta;
  const { top, bottom, x } = f.zona;
  const titulo = f.compacto ? 84 : 98, gap = f.compacto ? 6 : 8;
  const ancho = 540 - x * 2;
  const alto = altoPorDia(960 - top - bottom - titulo - gap, dias.length, gap, 220);
  return (
    <div ref={ref} style={{
      width:540,height:960,position:'relative',flexShrink:0,overflow:'hidden',borderRadius:16,
      backgroundColor:f.color,backgroundImage:`url(${f.img})`,backgroundSize:'100% 100%',
      color:TINTA,fontFamily:"'Outfit',sans-serif",boxShadow:'0 4px 24px rgba(0,0,0,.15)',
    }}>
      <div style={{position:'absolute',top,bottom,left:x,right:x,display:'flex',flexDirection:'column',gap}}>
        <div style={{height:titulo,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:f.compacto?4:6}}>
          <div style={{fontSize:13,letterSpacing:'.2em',textTransform:'uppercase',fontWeight:600,opacity:.8}}>Paupet · peluquería canina</div>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:f.compacto?44:50,fontWeight:600,lineHeight:1}}>Turnos libres</div>
          <div style={{fontSize:15,fontWeight:500}}>{rango} · reservá por WhatsApp</div>
        </div>

        <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',gap}}>
          {dias.length === 0
            ? <div style={{textAlign:'center',fontSize:18}}>Sin días activos</div>
            : dias.map(d => <StoryDiaFlex key={d.dia} dia={d} ancho={ancho} alto={alto} tema={TEMA} />)}
        </div>
      </div>
    </div>
  );
});

export default StoryPreviewFondo;
