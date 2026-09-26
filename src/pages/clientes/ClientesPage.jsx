import { useState, useMemo } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import ClienteCard from './ClienteCard';
import EstadoVacio from '../../components/ui/EstadoVacio';
import { C, pillSelectStyle } from '../../lib/styles';
import { FILTROS, ORDENES, conFrecuencia, normalizar } from './filtrosClientes';

const chipStyle = sel => ({
  height:36,padding:'0 14px',borderRadius:999,fontFamily:'inherit',fontSize:14,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
  background:sel?C.mentaSuave:'white',color:sel?C.verde:C.tinta,fontWeight:sel?600:400,
  border:sel?`1.5px solid ${C.mentaBorde}`:`1px solid ${C.linea}`,
});

export default function ClientesPage({ clientes, turnos, onOpenClient, onNuevo }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [orden, setOrden] = useState('nombre');

  const base = useMemo(() => conFrecuencia(clientes, turnos), [clientes, turnos]);
  const cuentas = useMemo(() => Object.fromEntries(FILTROS.map(f => [f.id, base.filter(f.test).length])), [base]);
  const filtered = useMemo(() => {
    const n = normalizar(q.trim());
    const f = FILTROS.find(x => x.id === filtro);
    const o = ORDENES.find(x => x.id === orden);
    return base
      .filter(c => f.test(c) && (!n || normalizar(`${c.dog} ${c.owner} ${c.raza} ${c.tel}`).includes(n)))
      .sort(o.cmp);
  }, [base, q, filtro, orden]);

  return (
    <section>
      <PageHeader title="Clientes" subtitle="Perros y dueños">
        <Btn onClick={onNuevo} size={isMob?'sm':''}>+ Nuevo cliente</Btn>
      </PageHeader>
      <div style={{marginBottom:12,display:'flex',gap:12,alignItems:'center',flexWrap:isMob?'wrap':'nowrap'}}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar perro, dueño, raza o teléfono..." style={{minWidth:isMob?'100%':0}} />
        <select value={orden} onChange={e=>setOrden(e.target.value)} aria-label="Ordenar" style={{...pillSelectStyle,flex:isMob?1:'none'}}>
          {ORDENES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <span style={{fontSize:13,color:C.tintaSuave,whiteSpace:'nowrap'}}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
      </div>
      <div role="group" aria-label="Filtrar clientes" style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:2}}>
        {FILTROS.map(f => (f.id === 'todos' || cuentas[f.id] > 0) && (
          <button key={f.id} type="button" aria-pressed={filtro===f.id} onClick={()=>setFiltro(f.id)} style={chipStyle(filtro===f.id)}>
            {f.label}{f.id !== 'todos' && <span style={{marginLeft:6,color:C.tintaSuave,fontWeight:500}}>{cuentas[f.id]}</span>}
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'minmax(0,1fr)':'repeat(auto-fill,minmax(200px,1fr))',gap:isMob?8:14}}>
        {!filtered.length ? (q.trim()
          ? <EstadoVacio ilustracion="buscando" titulo={`No encontramos «${q.trim()}»`} texto="Probá con el nombre del perro o del dueño, o con menos letras." style={{gridColumn:'1/-1'}} />
          : filtro !== 'todos'
          ? <EstadoVacio ilustracion="buscando" titulo="Nadie en este filtro" texto="Probá con «Todos»." style={{gridColumn:'1/-1'}} />
          : <EstadoVacio ilustracion="durmiendo" titulo="Todavía no hay clientes" texto="Agregá el primero con «+ Nuevo cliente»." style={{gridColumn:'1/-1'}} />)
          : filtered.map(c => <ClienteCard key={c.id} cliente={c} onClick={() => onOpenClient(c.id)} />)
        }
      </div>
    </section>
  );
}
