export default function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flex:1,minHeight:200}}>
      <div style={{width:36,height:36,border:'3px solid #dff5ec',borderTop:'3px solid #5fbf9b',borderRadius:'50%',animation:'spin 1s linear infinite'}} />
    </div>
  );
}
