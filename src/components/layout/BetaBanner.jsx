import { URL_VERSION_ANTERIOR } from '../../lib/constants';
import { useResp } from '../../context/resp';

// Aviso de "versión nueva en prueba". No se muestra en el dominio de la versión anterior.
export default function BetaBanner() {
  const { isMob } = useResp();
  if (window.location.origin === URL_VERSION_ANTERIOR) return null;
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',padding:'6px 14px',background:'#1F2A26',color:'white',fontSize:12,flexShrink:0}}>
      <span>{isMob ? 'Versión nueva (en prueba)' : <>Estás probando la <strong>versión nueva</strong>. Los datos son los mismos que en la anterior.</>}</span>
      <a href={URL_VERSION_ANTERIOR} style={{color:'#9fe3c7',fontWeight:600}}>{isMob ? 'Volver a la anterior →' : 'Volver a la versión anterior →'}</a>
    </div>
  );
}
