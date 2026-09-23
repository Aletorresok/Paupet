import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import { Table, Td } from '../../components/ui/Table';
import { fmtFecha, fmtPeso } from '../../lib/utils';

export function EgresosCards({ egresos, onEditNota, onDeleteNota }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {egresos.map(n=>(
        <div key={n.id} style={{background:'#F7F4EF',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #B83D62'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <strong style={{fontSize:13}}>{n.concepto}</strong>
            <strong style={{fontSize:13,color:'#B83D62'}}>{fmtPeso(n.monto)}</strong>
          </div>
          <div style={{fontSize:12,color:'#5B6661',marginBottom:6}}>{n.categoria} · {fmtFecha(n.fecha)}</div>
          <div style={{display:'flex',gap:5}}>
            <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)}><Icon name="edit" size={16}/>Editar</Btn>
            <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)} aria-label="Eliminar"><Icon name="trash" size={16}/></Btn>
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
          <Td><strong style={{color:'#B83D62'}}>{fmtPeso(n.monto)}</strong></Td>
          <Td>{fmtFecha(n.fecha)}</Td>
          <Td>
            <div style={{display:'flex',gap:5}}>
              <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)} aria-label="Editar"><Icon name="edit" size={16}/></Btn>
              <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)} aria-label="Eliminar"><Icon name="trash" size={16}/></Btn>
            </div>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
