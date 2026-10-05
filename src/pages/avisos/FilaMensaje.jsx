import PetAvatar from '../../components/ui/PetAvatar';
import { C } from '../../lib/styles';

// Una fila de la bandeja: perro · dueño, detalle y Enviar (o Enviado, que vuelve a abrir el WhatsApp).
// `menu`: algo más a la derecha (p. ej. el ⋯ de "les toca volver"). `onAbrir`: tocar el nombre abre la ficha.
export default function FilaMensaje({ cliente: c, perro, detalle, colorDetalle = C.tintaSuave, enviado, onEnviar, onAbrir, menu, primera }) {
  const texto = (
    <>
      <span style={{fontSize:16,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {perro} <span style={{fontWeight:400,color:C.tintaSuave}}>· {c.owner}</span>
      </span>
      <span style={{fontSize:13,color:colorDetalle}}>{detalle}</span>
    </>
  );
  const caja = {flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:1};
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderTop:primera ? 'none' : '1px solid #EFECE7'}}>
      <PetAvatar cliente={c} size={40} />
      {onAbrir
        ? <button type="button" onClick={onAbrir} style={{...caja,background:'none',border:'none',padding:0,textAlign:'left',fontFamily:'inherit',color:C.tinta,cursor:'pointer'}}>{texto}</button>
        : <span style={caja}>{texto}</span>}
      {c.tel ? (
        <button type="button" onClick={onEnviar} aria-label={`${enviado ? 'Volver a enviar' : 'Enviar'} WhatsApp a ${perro}`}
          style={{flex:'none',height:44,minWidth:92,padding:'0 14px',borderRadius:12,fontFamily:'inherit',fontSize:15,fontWeight:600,cursor:'pointer',
            ...(enviado ? {background:'#F6F5F2',color:C.tintaSuave,border:'none'} : {background:'white',color:C.tinta,border:'1px solid #D9D5CE'})}}>
          {enviado ? 'Enviado' : 'Enviar'}
        </button>
      ) : <span style={{flex:'none',fontSize:13,color:C.tintaSuave}}>Sin teléfono</span>}
      {menu}
    </div>
  );
}
