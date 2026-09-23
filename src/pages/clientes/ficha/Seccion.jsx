import { C, serif } from '../../../lib/styles';

export default function Seccion({ titulo, extra, children }) {
  return (
    <section style={{background:'white',border:`1px solid ${C.linea}`,borderRadius:16,padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <h4 style={{margin:0,fontFamily:serif,fontSize:18,fontWeight:600,flex:1}}>{titulo}</h4>
        {extra}
      </div>
      {children}
    </section>
  );
}
