import { URL_VERSION_ANTERIOR } from '../../lib/constants';
import { MODO_DEMO } from '../../lib/supabase';
import { reiniciarDemo } from '../../lib/demo/fakeSupabase';
import { useResp } from '../../context/resp';

// Aviso de "versión nueva en prueba". No se muestra en el dominio de la versión anterior.
// En modo demo avisa que los datos son ficticios.
export default function BetaBanner() {
  const { isMob } = useResp();
  if (MODO_DEMO) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',padding:'6px 14px',background:'#8A5300',color:'white',fontSize:12,flexShrink:0}}>
        <span><strong>MODO DEMO</strong>{isMob ? ' · datos ficticios' : ' · Datos ficticios guardados sólo en este navegador. La base real no se toca.'}</span>
        <button onClick={reiniciarDemo} style={{background:'rgba(255,255,255,.18)',color:'white',border:'1px solid rgba(255,255,255,.5)',borderRadius:8,padding:'2px 10px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Reiniciar datos</button>
      </div>
    );
  }
  if (window.location.origin === URL_VERSION_ANTERIOR) return null;
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',padding:'6px 14px',background:'#1F2A26',color:'white',fontSize:12,flexShrink:0}}>
      <span>{isMob ? 'Versión nueva (en prueba)' : <>Estás probando la <strong>versión nueva</strong>. Los datos son los mismos que en la anterior.</>}</span>
      <a href={URL_VERSION_ANTERIOR} style={{color:'#9fe3c7',fontWeight:600}}>{isMob ? 'Volver a la anterior →' : 'Volver a la versión anterior →'}</a>
    </div>
  );
}
