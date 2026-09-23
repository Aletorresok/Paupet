import durmiendo from '../../assets/ilustraciones/durmiendo.webp';
import buscando from '../../assets/ilustraciones/buscando.webp';
import enviado from '../../assets/ilustraciones/enviado.webp';
import banio from '../../assets/ilustraciones/banio.webp';
import { C, serif } from '../../lib/styles';

// Ilustraciones del salchicha para las pantallas vacías.
const ILUSTRACIONES = { durmiendo, buscando, enviado, banio };

export default function EstadoVacio({ ilustracion = 'durmiendo', titulo, texto, tamanio = 140, children, style }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:6,padding:'12px 8px',...style}}>
      <img src={ILUSTRACIONES[ilustracion]} alt="" width={tamanio} style={{width:tamanio,maxWidth:'70%',height:'auto',marginBottom:4}} />
      {titulo && <div style={{fontFamily:serif,fontSize:18,fontWeight:600,color:C.tinta,textWrap:'balance'}}>{titulo}</div>}
      {texto && <div style={{fontSize:14,color:C.tintaSuave,lineHeight:1.45,maxWidth:320}}>{texto}</div>}
      {children}
    </div>
  );
}
