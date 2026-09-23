import durmiendo from '../../assets/ilustraciones/durmiendo.webp';
import buscando from '../../assets/ilustraciones/buscando.webp';
import enviado from '../../assets/ilustraciones/enviado.webp';
import banio from '../../assets/ilustraciones/banio.webp';
import { C, serif } from '../../lib/styles';

// Ilustraciones del salchicha para las pantallas vacías.
const ILUSTRACIONES = { durmiendo, buscando, enviado, banio };

// El salchicha dormido respira y le salen "z" flotando (se apaga con "reducir movimiento";
// en ese caso las z quedan quietas y visibles).
function PerroDurmiendo({ tamanio }) {
  const fs = Math.round(tamanio * 0.16);
  return (
    <div aria-hidden="true" style={{position:'relative',width:tamanio,maxWidth:'70%',paddingTop:Math.round(tamanio*0.32),marginBottom:4}}>
      <img className="respira" src={durmiendo} alt="" style={{display:'block',width:'100%',height:'auto'}} />
      {[0,1,2].map(i => (
        <span key={i} className={`zzz zzz-${i+1}`} style={{left:`${24 + i*7}%`,top:`${34 - i*12}%`,fontSize:fs*(0.8 + i*0.25)}}>z</span>
      ))}
    </div>
  );
}

export default function EstadoVacio({ ilustracion = 'durmiendo', titulo, texto, tamanio = 140, children, style }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:6,padding:'12px 8px',...style}}>
      {ilustracion === 'durmiendo'
        ? <PerroDurmiendo tamanio={tamanio} />
        : <img src={ILUSTRACIONES[ilustracion]} alt="" width={tamanio} style={{width:tamanio,maxWidth:'70%',height:'auto',marginBottom:4}} />}
      {titulo && <div style={{fontFamily:serif,fontSize:18,fontWeight:600,color:C.tinta,textWrap:'balance'}}>{titulo}</div>}
      {texto && <div style={{fontSize:14,color:C.tintaSuave,lineHeight:1.45,maxWidth:320}}>{texto}</div>}
      {children}
    </div>
  );
}
