import { useResp } from '../../context/resp';
import { C, serif } from '../../lib/styles';

export default function PageHeader({ title, subtitle, children, titleStyle }) {
  const { isMob } = useResp();
  return (
    <div style={{marginBottom:20,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div style={{minWidth:0}}>
        {subtitle && <p style={{color:C.tintaSuave,fontSize:14,marginBottom:4}}>{subtitle}</p>}
        <h2 style={{fontFamily:serif,fontSize:isMob?26:32,fontWeight:600,lineHeight:1.1,margin:0,...titleStyle}}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
