import { serif } from '../../lib/styles';

export default function ModalHead({ title, subtitle, onClose, avatar }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,#dff5ec,#fde8ed)',
      padding:'24px 26px 18px', display:'flex', gap:16,
      position:'relative',
      flexDirection: avatar ? 'row' : 'column',
      alignItems: avatar ? 'flex-end' : 'flex-start',
    }}>
      {avatar && (
        <div style={{width:72,height:72,borderRadius:'50%',background:'white',border:'3px solid white',boxShadow:'0 4px 20px rgba(0,0,0,.08)',fontSize:34,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
          {avatar}
        </div>
      )}
      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontFamily:serif,fontSize:22,paddingRight:32}}>{title}</h3>
        {subtitle && <p style={{color:'#9a9090',fontSize:12,marginTop:2}}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'white',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.06)',color:'#9a9090'}}>✕</button>
    </div>
  );
}
