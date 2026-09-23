// Switch accesible. No propaga el click (vive dentro de un encabezado que expande/colapsa).
export default function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label}
      onClick={e => { e.stopPropagation(); onChange(!on); }}
      style={{position:'relative',display:'inline-block',width:38,height:20,cursor:'pointer',border:'none',padding:0,background:'none'}}>
      <span style={{position:'absolute',inset:0,background:on?'#5fbf9b':'#d0cece',borderRadius:20,transition:'.3s',display:'block'}}/>
      <span style={{position:'absolute',height:14,width:14,left:on?21:3,top:3,background:'white',borderRadius:'50%',transition:'.3s',boxShadow:'0 1px 4px rgba(0,0,0,.2)',display:'block'}}/>
    </button>
  );
}
