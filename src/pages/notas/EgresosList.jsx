import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import { Table, Td } from '../../components/ui/Table';
import { fmtFecha, fmtPeso } from '../../lib/utils';

export function EgresosCards({ egresos, onEditNota, onDeleteNota }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {egresos.map(n=>(
        <div key={n.id} style={{background:'#faf8f5',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #e8809a'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <strong style={{fontSize:13}}>{n.concepto}</strong>
            <strong style={{fontSize:13,color:'#e8809a'}}>{fmtPeso(n.monto)}</strong>
          </div>
          <div style={{fontSize:12,color:'#9a9090',marginBottom:6}}>{n.categoria} · {fmtFecha(n.fecha)}</div>
          <div style={{display:'flex',gap:5}}>
            <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)}>✏️ Editar</Btn>
            <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EgresosTable({ egresos, onEditNota, onDeleteNota }) {
  return (
    <Table headers={['Concepto','Categoría','Monto','Fecha','']}>
      {egresos.map(n=>(
        <tr key={n.id}>
          <Td><strong>{n.concepto}</strong></Td>
          <Td><Badge variant="blue">{n.categoria}</Badge></Td>
          <Td><strong style={{color:'#e8809a'}}>{fmtPeso(n.monto)}</strong></Td>
          <Td>{fmtFecha(n.fecha)}</Td>
          <Td>
            <div style={{display:'flex',gap:5}}>
              <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)}>✏️</Btn>
              <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
            </div>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
