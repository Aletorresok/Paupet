import { serif } from '../../lib/styles';

export default function SidebarBrand() {
  return (
    <div style={{textAlign:'center',marginBottom:24,position:'relative',zIndex:1}}>
      <div style={{width:50,height:50,background:'white',borderRadius:'50%',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 16px rgba(0,0,0,.15)'}}>🐾</div>
      <h1 style={{fontFamily:serif,fontSize:19,color:'white',letterSpacing:.5}}>Paupet</h1>
      <span style={{fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:300,letterSpacing:1,textTransform:'uppercase'}}>Peluquería Canina</span>
    </div>
  );
}
