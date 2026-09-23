import { C, serif } from '../../lib/styles';
import Icon from './Icon';

export default function ModalHead({ title, subtitle, onClose, avatar }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'18px 22px',borderBottom:`1px solid ${C.linea}`,background:'white',position:'sticky',top:0,zIndex:1}}>
      {avatar && (
        <div style={{width:56,height:56,borderRadius:'50%',background:C.mentaSuave,fontSize:28,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
          {avatar}
        </div>
      )}
      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontFamily:serif,fontSize:22,fontWeight:600,margin:0}}>{title}</h3>
        {subtitle && <p style={{color:C.tintaSuave,fontSize:14,marginTop:2}}>{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar" style={{width:40,height:40,borderRadius:10,border:'none',background:'transparent',color:C.tintaSuave,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon name="x" size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
