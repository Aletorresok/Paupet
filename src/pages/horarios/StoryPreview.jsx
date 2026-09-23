import { forwardRef } from 'react';
import { PELUQUERA_IMG } from '../../lib/constants';
import StoryDayCard from './StoryDayCard';

const Paws = ({ side }) => (
  <div style={{position:'absolute',top:10,[side]:8,opacity:.18,pointerEvents:'none',lineHeight:1,textAlign:side==='right'?'right':undefined}}>
    {side==='left' ? <>
      <div style={{fontSize:26,transform:'rotate(-15deg)'}}>🐾</div>
      <div style={{fontSize:18,marginTop:2,marginLeft:12,transform:'rotate(-5deg)'}}>🐾</div>
    </> : <>
      <div style={{fontSize:18,transform:'rotate(5deg)'}}>🐾</div>
      <div style={{fontSize:26,marginTop:2,marginRight:4,transform:'rotate(15deg)'}}>🐾</div>
    </>}
  </div>
);

// Imagen 540x960 (se exporta a 1080x1920) para publicar en Stories.
// `dias` = [{dia, date, horas, tomados}] sólo de los días activos.
const StoryPreview = forwardRef(function StoryPreview({ dias }, ref) {
  const total = dias.length;
  const IMG_H=140, topArea=28+50+16, botPad=16, cardGap=8;
  const cardH = Math.max(60, Math.floor((960-topArea-botPad-IMG_H-cardGap*(total-1))/total));
  return (
    <div ref={ref} style={{
      width:540,height:960,background:'#7ec8a0',borderRadius:16,padding:'28px 20px 16px',
      position:'relative',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,.15)',
      fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",flexShrink:0,display:'flex',flexDirection:'column',
    }}>
      <Paws side="left" />
      <Paws side="right" />
      <div style={{textAlign:'center',marginBottom:16,flexShrink:0}}>
        <span style={{fontSize:50,fontWeight:900,letterSpacing:14,color:'#1a1a1a',textTransform:'uppercase',fontFamily:"'Trebuchet MS',Impact,sans-serif",display:'inline-block'}}>HORARIOS</span>
      </div>
      {total === 0
        ? <p style={{textAlign:'center',color:'white',fontSize:16}}>Sin días activos</p>
        : dias.map((d, idx) => (
          <StoryDayCard key={d.dia} {...d} height={cardH} marginBottom={idx<total-1?cardGap:0} />
        ))
      }
      <div style={{display:'flex',justifyContent:'center',alignItems:'flex-end',flexShrink:0,marginTop:8,height:IMG_H}}>
        <img src={PELUQUERA_IMG} style={{height:IMG_H,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous"/>
      </div>
    </div>
  );
});

export default StoryPreview;
