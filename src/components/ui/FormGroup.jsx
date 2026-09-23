export default function FormGroup({ label, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <label style={{fontSize:13,color:'#46524D',fontWeight:600}}>{label}</label>
      {children}
    </div>
  );
}
