import { useState } from 'react';
import { useResp } from '../../context/resp';
import MonthSelect from '../../components/ui/MonthSelect';
import SearchInput from '../../components/ui/SearchInput';
import { cardStyle, emptyTextStyle } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { EgresosCards, EgresosTable } from './EgresosList';

export default function EgresosTab({ notas, onEditNota, onDeleteNota }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const [mes, setMes] = useState('');
  let egresos = notas.filter(n=>n.tipo==='egreso'&&(!q||(n.concepto+n.categoria).toLowerCase().includes(q.toLowerCase())));
  if (mes) egresos=egresos.filter(n=>n.fecha && n.fecha.startsWith(mes));
  const totalEgresos = egresos.reduce((s,n)=>s+n.monto,0);
  const egresoMonths = [...new Set(notas.filter(n=>n.tipo==='egreso' && n.fecha).map(n=>n.fecha.slice(0,7)))];
  const List = isMob ? EgresosCards : EgresosTable;

  return (
    <div style={{...cardStyle,padding:'18px 20px'}}>
      <div style={{marginBottom:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar egreso..." style={{minWidth:160}} />
        <MonthSelect value={mes} onChange={setMes} months={egresoMonths} />
        <span style={{fontSize:13,color:'#1F5A45',fontWeight:600,whiteSpace:'nowrap'}}>Total: {fmtPeso(totalEgresos)}</span>
      </div>
      {!egresos.length ? <div style={emptyTextStyle}>No hay egresos registrados</div>
        : <List egresos={egresos} onEditNota={onEditNota} onDeleteNota={onDeleteNota} />
      }
    </div>
  );
}
