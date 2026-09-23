import { useState, useMemo } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import ClienteCard from './ClienteCard';
import EstadoVacio from '../../components/ui/EstadoVacio';

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
      <div style={{display:'grid',gridTemplateColumns:isMob?'minmax(0,1fr)':'repeat(auto-fill,minmax(200px,1fr))',gap:isMob?8:14}}>
        {!filtered.length ? (q.trim()
          ? <EstadoVacio ilustracion="buscando" titulo={`No encontramos «${q.trim()}»`} texto="Probá con el nombre del perro o del dueño, o con menos letras." style={{gridColumn:'1/-1'}} />
          : <EstadoVacio ilustracion="durmiendo" titulo="Todavía no hay clientes" texto="Agregá el primero con «+ Nuevo cliente»." style={{gridColumn:'1/-1'}} />)
          : filtered.map(c => <ClienteCard key={c.id} cliente={c} onClick={() => onOpenClient(c.id)} />)
        }
      </div>
    </section>
  );
}
