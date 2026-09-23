import { animalIcon } from '../../lib/utils';

// Avatar redondo chico con la foto del perro o un emoji según la raza.
export default function PetAvatar({ cliente, size = 34, fontSize = 15 }) {
  const c = cliente || {};
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:'#fde8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize,flexShrink:0,overflow:'hidden'}}>
      {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : animalIcon(c.raza)}
    </div>
  );
}
