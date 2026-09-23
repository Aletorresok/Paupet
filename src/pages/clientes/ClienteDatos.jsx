import { useResp } from '../../context/resp';

export default function ClienteDatos({ cliente: c }) {
  const { isMob } = useResp();
  const datos = [
    {l:'Raza',v:c.raza||'–'},
    {l:'Tamaño',v:c.size||'–'},
    {l:'Pelaje',v:c.pelaje||'–'},
    {l:'Visitas',v:(c.visitas||[]).length},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:isMob?'1fr 1fr':'repeat(4,1fr)',gap:8,marginBottom:14}}>
      {datos.map(ch=>(
        <div key={ch.l} style={{background:'white',borderRadius:10,padding:'8px 12px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:10,color:'#5B6661',textTransform:'uppercase',letterSpacing:.5}}>{ch.l}</div>
          <div style={{fontSize:13,fontWeight:500,marginTop:1}}>{ch.v}</div>
        </div>
      ))}
    </div>
  );
}
