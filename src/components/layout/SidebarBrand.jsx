import { C, serif } from '../../lib/styles';
import Icon from '../ui/Icon';

export default function SidebarBrand() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 8px'}}>
      <div style={{width:40,height:40,borderRadius:12,background:C.menta,color:C.sobreMenta,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="paw" size={22} />
      </div>
      <div style={{display:'flex',flexDirection:'column'}}>
        <span style={{fontFamily:serif,fontSize:20,fontWeight:600,lineHeight:1.1}}>Paupet</span>
        <span style={{fontSize:12,color:C.tintaSuave}}>Peluquería canina</span>
      </div>
    </div>
  );
}
