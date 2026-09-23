import Badge from '../../components/ui/Badge';
import { Table, Td } from '../../components/ui/Table';
import { fmtFecha, fmtPeso } from '../../lib/utils';

export default function HistorialTable({ items }) {
  return (
    <Table headers={['Mascota','Dueño','Servicio','Fecha','Pago','Precio']}>
      {items.map((v,i)=>(
        <tr key={v.id||i}>
          <Td><strong>{v.dog||'–'}</strong></Td>
          <Td>{v.owner||'–'}</Td>
          <Td>{v.servicio}</Td>
          <Td>{fmtFecha(v.fecha)}</Td>
          <Td><Badge variant={v.forma_pago==='transferencia'?'blue':'green'}>{v.forma_pago || 'efectivo'}</Badge></Td>
          <Td><strong style={{color:'#3a9b7b'}}>{fmtPeso(v.precio)}</strong></Td>
        </tr>
      ))}
    </Table>
  );
}
