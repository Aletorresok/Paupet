import { useResp } from '../../context/resp';
import { serif } from '../../lib/styles';

export default function PageHeader({ title, subtitle, children, titleStyle }) {
  const { isMob } = useResp();
  return (
    <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div>
        <h2 style={{fontFamily:serif,fontSize:isMob?24:30,fontWeight:600,...titleStyle}}>{title}</h2>
        <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
