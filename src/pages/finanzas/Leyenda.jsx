import { C } from '../../lib/styles';

export default function Leyenda({ items }) {
  return (
    <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
      {items.map(i => (
        <span key={i.label} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:C.tintaSuave}}>
          <span style={{width:10,height:10,borderRadius:3,background:i.color}}/>{i.label}
        </span>
      ))}
    </div>
  );
}
