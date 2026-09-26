import { C } from '../../lib/styles';

// Cuatro números de la clientela, con una línea que explica cada uno.
export default function ClientelaStats({ e }) {
  const items = [
    { n: e.activos, label: 'Activos', det: 'vinieron en los últimos 3 meses', color: C.verde },
    { n: e.nuevos, label: 'Nuevos', det: 'primera visita este mes', color: C.verde },
    { n: e.vencidos, label: 'Se pasaron', det: 'ya les tocaba volver', color: C.ambar },
    { n: e.perdidos, label: 'Sin venir', det: 'hace más de 4 meses', color: C.rosa },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      {items.map(i => (
        <div key={i.label} style={{border:`1px solid ${C.linea}`,borderRadius:12,padding:'10px 12px'}}>
          <div style={{fontSize:24,fontWeight:600,color:i.color,lineHeight:1.1}}>{i.n}</div>
          <div style={{fontSize:14,fontWeight:600}}>{i.label}</div>
          <div style={{fontSize:12,color:C.tintaSuave}}>{i.det}</div>
        </div>
      ))}
    </div>
  );
}
