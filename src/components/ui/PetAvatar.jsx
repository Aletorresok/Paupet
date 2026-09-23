import { avatarPorRaza, esGato } from '../../lib/avatarPerro';

// Avatar redondo con la foto del perro o, si no tiene, una cara ilustrada según la raza.
export default function PetAvatar({ cliente, size = 34, style }) {
  const c = cliente || {};
  const base = {width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',display:'block',...style};
  if (c.foto) return <img src={c.foto} alt="" style={{...base,objectFit:'cover'}} />;
  if (esGato(c.raza)) return <span aria-hidden="true" style={{...base,display:'flex',alignItems:'center',justifyContent:'center',background:'#FBE7EC',fontSize:size*.5}}>🐱</span>;
  return <img src={avatarPorRaza(c.raza)} alt="" width={size} height={size} style={base} />;
}
