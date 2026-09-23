import { C, sans } from '../../lib/styles';
import Icon from './Icon';

export default function SearchInput({ value, onChange, placeholder, style }) {
  return (
    <label style={{display:'flex',alignItems:'center',gap:8,background:'white',border:`1px solid ${C.linea}`,borderRadius:12,height:44,padding:'0 14px',boxSizing:'border-box',flex:1,color:C.tintaSuave,...style}}>
      <Icon name="search" />
      <input type="search" aria-label={placeholder} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{border:'none',outline:'none',fontFamily:sans,fontSize:15,width:'100%',background:'transparent',color:C.tinta}} />
    </label>
  );
}
