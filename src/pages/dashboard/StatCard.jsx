import { useResp } from '../../context/resp';
import { serif } from '../../lib/styles';

export default function StatCard({ label, val, sub, emoji }) {
  const { isMob } = useResp();
  return (
    <div style={{background:'white',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',right:-6,top:-2,fontSize:44,opacity:.1}}>{emoji}</div>
      <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
      <div style={{fontFamily:serif,fontSize:isMob?22:28,fontWeight:600,lineHeight:1.1,margin:'3px 0'}}>{val}</div>
      <div style={{fontSize:10,color:'#9a9090'}}>{sub}</div>
    </div>
  );
}
