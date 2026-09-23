import { useState, useMemo } from 'react';
import { useResp } from '../../context/resp';
import MonthSelect from '../../components/ui/MonthSelect';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import { cardStyle, emptyTextStyle } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { useHistorial } from './useHistorial';
import HistorialCards from './HistorialCards';
import HistorialTable from './HistorialTable';

export default function HistorialPage({ clientes, turnos }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const [mes, setMes] = useState('');
  const { all, months } = useHistorial(clientes, turnos);

  const filtered = useMemo(() =>
    all.filter(v => {
      const mq = !q || (v.dog+v.owner+v.servicio).toLowerCase().includes(q.toLowerCase());
      const mm = !mes || (v.fecha && v.fecha.startsWith(mes));
      return mq && mm;
    }), [all, q, mes]);

  const totalFiltered = filtered.reduce((s,v) => s+(v.precio||0), 0);

  return (
    <section>
      <PageHeader title="Historial de Visitas" subtitle="Registro completo de todos los servicios">
        {totalFiltered > 0 && <div style={{background:'#dff5ec',borderRadius:50,padding:'8px 16px',fontSize:13,fontWeight:600,color:'#3a9b7b'}}>Total: {fmtPeso(totalFiltered)}</div>}
      </PageHeader>
      <div style={{...cardStyle,padding:'18px 20px'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar..." style={{minWidth:180}} />
          <MonthSelect value={mes} onChange={setMes} months={months} />
        </div>
        {!filtered.length ? <div style={emptyTextStyle}>No hay registros</div>
          : isMob ? <HistorialCards items={filtered} /> : <HistorialTable items={filtered} />
        }
      </div>
    </section>
  );
}
