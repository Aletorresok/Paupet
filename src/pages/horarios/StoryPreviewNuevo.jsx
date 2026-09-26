import { forwardRef } from 'react';
import { PELUQUERA_IMG } from '../../lib/constants';
import StoryDiaFlex from './StoryDiaFlex';
import { altoPorDia } from './storyLayout';

const MINT = '#5FBF9B';
const TINTA = '#13302A';
const TEMA = { fondo:'white', banda:'#1F5A45', sobreBanda:'white', texto:TINTA, apagado:'#8A948F', radio:18, sombra:'none' };

// Medidas fijas (px sobre 540×960) para repartir el resto entre los días, como el Clásico.
const PAD_X = 30, ARRIBA = 36, ENCABEZADO = 128, IMG_H = 150, GAP = 10;
const ANCHO = 540 - PAD_X * 2;
const DISPONIBLE = 960 - ARRIBA - ENCABEZADO - IMG_H - 16;

// Diseño nuevo de la imagen para Stories (540x960, se exporta a 1080x1920).
// Muestra sólo los horarios libres de cada día activo; si no queda ninguno, "Completo".
// Los recuadros crecen o se achican según cuántos días hay, y la letra se ajusta a cada uno.
// `dias` = [{dia, date, horas, tomados}] sólo de los días activos. `rango` = "29 sep – 4 oct".
const StoryPreviewNuevo = forwardRef(function StoryPreviewNuevo({ dias, rango }, ref) {
  const alto = altoPorDia(DISPONIBLE, dias.length, GAP);
  return (
    <div ref={ref} style={{
      width:540,height:960,background:MINT,color:TINTA,borderRadius:16,boxSizing:'border-box',
      padding:`${ARRIBA}px ${PAD_X}px 0`,display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden',
      fontFamily:"'Outfit',sans-serif",boxShadow:'0 4px 24px rgba(0,0,0,.15)',
    }}>
      <div style={{height:ENCABEZADO,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
        <div style={{fontSize:17,letterSpacing:'.22em',textTransform:'uppercase',fontWeight:600,opacity:.8}}>Paupet · peluquería canina</div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:62,fontWeight:600,lineHeight:1}}>Turnos libres</div>
        <div style={{fontSize:20,fontWeight:500}}>{rango} · reservá por WhatsApp</div>
      </div>

      <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:GAP}}>
        {dias.length === 0
          ? <div style={{textAlign:'center',fontSize:22}}>Sin días activos</div>
          : dias.map(d => <StoryDiaFlex key={d.dia} dia={d} ancho={ANCHO} alto={alto} tema={TEMA} />)}
      </div>

      <div style={{height:IMG_H,flexShrink:0,display:'flex',justifyContent:'center',alignItems:'flex-end'}}>
        <img src={PELUQUERA_IMG} alt="" crossOrigin="anonymous" style={{height:IMG_H,maxWidth:'100%',objectFit:'contain',objectPosition:'bottom'}}/>
      </div>
    </div>
  );
});

export default StoryPreviewNuevo;
