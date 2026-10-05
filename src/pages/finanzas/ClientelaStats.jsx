import { C } from '../../lib/styles';
import Icon from '../../components/ui/Icon';
import { GRUPOS_CLIENTELA } from './estadoClientes';

// Cuatro números de la clientela, con una línea que explica cada uno. Tocar uno muestra quiénes son.
export default function ClientelaStats({ e, onVer }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      {GRUPOS_CLIENTELA.map(i => (
        <button key={i.id} type="button" onClick={() => onVer(i.id)} disabled={!e[i.id].length}
          style={{border:`1px solid ${C.linea}`,borderRadius:12,padding:'10px 12px',background:'white',textAlign:'left',font:'inherit',color:C.tinta,cursor:e[i.id].length?'pointer':'default'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <span style={{flex:1,fontSize:24,fontWeight:600,color:i.color,lineHeight:1.1}}>{e[i.id].length}</span>
            {!!e[i.id].length && <span style={{color:C.tintaSuave,display:'flex'}}><Icon name="right" size={16} strokeWidth={2} /></span>}
          </div>
          <div style={{fontSize:14,fontWeight:600}}>{i.label}</div>
          <div style={{fontSize:12,color:C.tintaSuave}}>{i.det}</div>
        </button>
      ))}
    </div>
  );
}
