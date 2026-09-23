export default function FormGroup({ label, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.6,fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}
