import { sans } from '../../lib/styles';

export default function SearchInput({ value, onChange, placeholder, style }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',flex:1,...style}}>
      <span>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{border:'none',outline:'none',fontFamily:sans,fontSize:13,width:'100%',background:'transparent'}} />
    </div>
  );
}
