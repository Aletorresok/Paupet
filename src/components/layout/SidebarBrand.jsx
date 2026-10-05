import { C, serif } from '../../lib/styles';
import PauAvatar from '../ui/PauAvatar';

export default function SidebarBrand() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 6px'}}>
      <PauAvatar size={44} />
      <div style={{display:'flex',flexDirection:'column'}}>
        <span style={{fontFamily:serif,fontSize:20,fontWeight:600,lineHeight:1.1}}>Paupet</span>
        <span style={{fontSize:13,color:C.tintaSuave}}>Peluquería canina 🐾</span>
      </div>
    </div>
  );
}
