// Switch visual (sin interacción propia).
export default function Toggle({ on }) {
  return (
    <span style={{position:'relative',display:'inline-block',width:38,height:20,cursor:'pointer'}}>
      <span style={{position:'absolute',inset:0,background:on?'#5fbf9b':'#d0cece',borderRadius:20,transition:'.3s',display:'block'}}/>
      <span style={{position:'absolute',height:14,width:14,left:on?21:3,top:3,background:'white',borderRadius:'50%',transition:'.3s',boxShadow:'0 1px 4px rgba(0,0,0,.2)',display:'block'}}/>
    </span>
  );
}
