import { forwardRef } from 'react';
import { PELUQUERA_IMG } from '../../lib/constants';

const MINT = '#5FBF9B';
const TINTA = '#13302A';

// Tamaño de letra de los horarios según cuántos hay, para que entren en la fila.
const fontHoras = n => n > 8 ? 17 : n > 5 ? 20 : 23;

// Diseño nuevo de la imagen para Stories (540x960, se exporta a 1080x1920).
// Muestra sólo los horarios libres de cada día activo; si no queda ninguno, "Completo".
// `dias` = [{dia, date, horas, tomados}] sólo de los días activos. `rango` = "29 sep – 4 oct".
const StoryPreviewNuevo = forwardRef(function StoryPreviewNuevo({ dias, rango }, ref) {
  return (
    <div ref={ref} style={{
      width:540,height:960,background:MINT,color:TINTA,borderRadius:16,boxSizing:'border-box',
      padding:'40px 30px 0',display:'flex',flexDirection:'column',gap:10,flexShrink:0,overflow:'hidden',
      fontFamily:"'Outfit',sans-serif",boxShadow:'0 4px 24px rgba(0,0,0,.15)',
    }}>
      <div style={{fontSize:17,letterSpacing:'.22em',textTransform:'uppercase',textAlign:'center',fontWeight:600,opacity:.8}}>Paupet · peluquería canina</div>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:62,fontWeight:600,textAlign:'center',lineHeight:1}}>Turnos libres</div>
      <div style={{fontSize:20,textAlign:'center',marginBottom:8,fontWeight:500}}>{rango} · reservá por WhatsApp</div>

      {dias.length === 0
        ? <div style={{textAlign:'center',fontSize:22,marginTop:40}}>Sin días activos</div>
        : dias.map(d => {
          const libres = d.horas.filter(h => !d.tomados.includes(h));
          return (
            <div key={d.dia} style={{background:'white',borderRadius:18,padding:'12px 20px',display:'flex',alignItems:'center',gap:16,minHeight:58,boxSizing:'border-box'}}>
              <span style={{width:92,flexShrink:0,fontSize:18,fontWeight:700,textTransform:'uppercase',color:'#1F5A45',letterSpacing:'.04em'}}>
                {d.date.toLocaleDateString('es-AR',{weekday:'short'}).replace('.','')} {d.date.getDate()}
              </span>
              <span style={{fontSize:libres.length ? fontHoras(libres.length) : 20,fontWeight:libres.length ? 700 : 500,color:libres.length ? TINTA : '#8A948F',lineHeight:1.35}}>
                {libres.length ? libres.join(' · ') : 'Completo'}
              </span>
            </div>
          );
        })
      }

      <div style={{flex:1,minHeight:0,display:'flex',justifyContent:'center',alignItems:'flex-end'}}>
        <img src={PELUQUERA_IMG} alt="" crossOrigin="anonymous" style={{maxHeight:300,maxWidth:'100%',objectFit:'contain',objectPosition:'bottom'}}/>
      </div>
    </div>
  );
});

export default StoryPreviewNuevo;
