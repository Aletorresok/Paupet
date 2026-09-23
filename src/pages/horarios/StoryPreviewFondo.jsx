import { forwardRef } from 'react';
import { FONDOS } from './fondosStory';

const TINTA = '#13302A';

const fontHoras = (n, compacto) => (n > 8 ? 14 : n > 5 ? 16 : 18) - (compacto ? 1 : 0);

// Imagen de horarios sobre un fondo ilustrado (540×960, se exporta a 1080×1920).
// `dias` = días activos [{dia, date, horas, tomados}]; muestra sólo los horarios libres.
const StoryPreviewFondo = forwardRef(function StoryPreviewFondo({ dias, rango, fondo = 'menta' }, ref) {
  const f = FONDOS[fondo] || FONDOS.menta;
  const { top, bottom, x } = f.zona;
  return (
    <div ref={ref} style={{
      width:540,height:960,position:'relative',flexShrink:0,overflow:'hidden',borderRadius:16,
      backgroundColor:f.color,backgroundImage:`url(${f.img})`,backgroundSize:'100% 100%',
      color:TINTA,fontFamily:"'Outfit',sans-serif",boxShadow:'0 4px 24px rgba(0,0,0,.15)',
    }}>
      <div style={{position:'absolute',top,bottom,left:x,right:x,display:'flex',flexDirection:'column',gap:f.compacto?6:8,justifyContent:'center'}}>
        <div style={{fontSize:13,letterSpacing:'.2em',textTransform:'uppercase',textAlign:'center',fontWeight:600,opacity:.8}}>Paupet · peluquería canina</div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:f.compacto?44:50,fontWeight:600,textAlign:'center',lineHeight:1}}>Turnos libres</div>
        <div style={{fontSize:15,textAlign:'center',marginBottom:f.compacto?2:6,fontWeight:500}}>{rango} · reservá por WhatsApp</div>

        {dias.length === 0
          ? <div style={{textAlign:'center',fontSize:18,marginTop:24}}>Sin días activos</div>
          : dias.map(d => {
            const libres = d.horas.filter(h => !d.tomados.includes(h));
            return (
              <div key={d.dia} style={{
                background:'rgba(255,255,255,.94)',borderRadius:14,padding:f.compacto?'7px 12px':'9px 14px',
                display:'flex',alignItems:'center',gap:10,minHeight:f.compacto?44:50,boxSizing:'border-box',
                boxShadow:'0 1px 0 rgba(19,48,42,.08)',
              }}>
                <span style={{width:62,flexShrink:0,fontSize:14,fontWeight:700,textTransform:'uppercase',color:'#1F5A45',letterSpacing:'.03em'}}>
                  {d.date.toLocaleDateString('es-AR',{weekday:'short'}).replace('.','')} {d.date.getDate()}
                </span>
                <span style={{fontSize:libres.length ? fontHoras(libres.length, f.compacto) : 15,fontWeight:libres.length ? 700 : 500,color:libres.length ? TINTA : '#8A948F',lineHeight:1.3}}>
                  {libres.length ? libres.join(' · ') : 'Completo'}
                </span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
});

export default StoryPreviewFondo;
