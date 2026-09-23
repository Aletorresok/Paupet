import { useState, useMemo } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import ClienteCard from './ClienteCard';

export default function ClientesPage({ clientes, onOpenClient, onNuevo }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const filtered = useMemo(() =>
    clientes.filter(c =>
      (c.dog || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.owner || '').toLowerCase().includes(q.toLowerCase())
    ), [clientes, q]);

  return (
    <section>
      <PageHeader title="Clientes" subtitle="Perros y dueños">
        <Btn onClick={onNuevo} size={isMob?'sm':''}>+ Nuevo cliente</Btn>
      </PageHeader>
      <div style={{marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar perrito o dueño..." />
        <span style={{fontSize:13,color:'#5B6661',whiteSpace:'nowrap'}}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${isMob?'150px':'200px'},1fr))`,gap:14}}>
        {!filtered.length ? <p style={{color:'#5B6661',fontSize:14,padding:'24px 0'}}>Sin clientes. ¡Agregá el primero!</p>
          : filtered.map(c => <ClienteCard key={c.id} cliente={c} onClick={() => onOpenClient(c.id)} />)
        }
      </div>
    </section>
  );
}
