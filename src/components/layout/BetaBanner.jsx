import { URL_VERSION_ANTERIOR } from '../../lib/constants';

// Aviso de "versión nueva en prueba". No se muestra en el dominio de la versión anterior.
export default function BetaBanner() {
  if (window.location.origin === URL_VERSION_ANTERIOR) return null;
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap',padding:'6px 14px',background:'#2e2828',color:'white',fontSize:12,flexShrink:0}}>
      <span>✨ Estás probando la <strong>versión nueva</strong>. Los datos son los mismos que en la anterior.</span>
      <a href={URL_VERSION_ANTERIOR} style={{color:'#9fe3c7',fontWeight:600}}>Volver a la versión anterior →</a>
    </div>
  );
}
