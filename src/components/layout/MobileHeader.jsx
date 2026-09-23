import { serif } from '../../lib/styles';

const bar = w => <span style={{display:'block',width:w,height:2,background:'#4caf8e',borderRadius:2}}/>;

export default function MobileHeader({ onMenu }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'white',borderBottom:'1px solid #ede8e8',boxShadow:'0 2px 8px rgba(0,0,0,.05)',flexShrink:0}}>
      <button onClick={onMenu} style={{background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,display:'flex',flexDirection:'column',gap:4}}>
        {bar(20)}{bar(14)}{bar(20)}
      </button>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        <span style={{fontSize:16}}>🐾</span>
        <span style={{fontFamily:serif,fontSize:17,fontWeight:600}}>Paupet</span>
      </div>
      <div style={{width:32}}/>
    </div>
  );
}
