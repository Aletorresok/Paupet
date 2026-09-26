import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import { inputStyle } from '../../lib/styles';

// Bloque "¿Cliente nuevo o existente?" del modal de turno.
export default function ClienteSelector({ isEdit, mode, onMode, form, set, clientes }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  // Filtra por perro, dueño o teléfono; el elegido siempre queda en la lista.
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const visibles = q.trim()
    ? clientes.filter(c => String(c.id) === String(form.clientId) || norm(`${c.dog} ${c.owner} ${c.tel}`).includes(norm(q.trim())))
    : clientes;
  const elegir = v => { set('clientId', v); };
  const field = (k, placeholder) => (
    <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder} style={inputStyle} />
  );
  return (
    <div style={{marginBottom:14,padding:12,background:'#dff5ec',borderRadius:10}}>
      <div style={{fontSize:11,fontWeight:600,color:'#1F5A45',marginBottom:8,textTransform:'uppercase'}}>
        {isEdit ? '🔄 Reasignar cliente (opcional)' : '¿Cliente nuevo o existente?'}
      </div>
      {!isEdit && (
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>onMode('exist')} style={{flex:1,justifyContent:'center'}}>Existente</Btn>
          <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>onMode('new')} style={{flex:1,justifyContent:'center'}}>Crear nuevo</Btn>
        </div>
      )}
      {(mode==='exist' || isEdit) && (
        <FormGroup label="Seleccionar cliente">
          <input type="search" value={q} placeholder="Buscar perro, dueño o teléfono…" aria-label="Buscar cliente" style={{...inputStyle,marginBottom:6}}
            onChange={e => {
              setQ(e.target.value);
              const n = norm(e.target.value.trim());
              const hits = n ? clientes.filter(c => norm(`${c.dog} ${c.owner} ${c.tel}`).includes(n)) : [];
              if (hits.length === 1) elegir(String(hits[0].id));
            }} />
          <select value={form.clientId} onChange={e=>elegir(e.target.value)} style={inputStyle}>
            <option value="">{isEdit ? '— Sin cambios —' : visibles.length === clientes.length ? '— Seleccionar —' : `— ${visibles.length} coinciden —`}</option>
            {visibles.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
          </select>
        </FormGroup>
      )}
      {!isEdit && mode==='new' && (
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginTop:8}}>
          <FormGroup label="Nombre del perro">{field('dog','Ej: Coco')}</FormGroup>
          <FormGroup label="Dueño">{field('owner','Ej: María García')}</FormGroup>
          <FormGroup label="Raza">{field('raza','Caniche')}</FormGroup>
          <FormGroup label="Teléfono">{field('tel','11-xxxx-xxxx')}</FormGroup>
        </div>
      )}
    </div>
  );
}
