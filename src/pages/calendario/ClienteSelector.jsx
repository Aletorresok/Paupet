import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import DuenoPicker from '../../components/ui/DuenoPicker';
import FormGroup from '../../components/ui/FormGroup';
import { normalizar } from '../../lib/duenos';
import { C, inputStyle } from '../../lib/styles';

const tituloStyle = {fontSize:12,fontWeight:600,color:C.verde,marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'};

// Bloque del modal de turno para elegir el perro: uno que ya viene, o uno nuevo.
// Un perro nuevo puede ser de un dueño nuevo o de alguien que ya es cliente (se copian su nombre y teléfono).
export default function ClienteSelector({ isEdit, mode, onMode, form, set, clientes }) {
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const [duenoExistente, setDuenoExistente] = useState(false);
  const [dueno, setDueno] = useState(null);

  // Filtra por perro, dueño o teléfono; el elegido siempre queda en la lista.
  const visibles = q.trim()
    ? clientes.filter(c => String(c.id) === String(form.clientId) || normalizar(`${c.dog} ${c.owner} ${c.tel}`).includes(normalizar(q)))
    : clientes;
  const elegir = v => { set('clientId', v); };
  const field = (k, placeholder, extra = {}) => (
    <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder} style={inputStyle} {...extra} />
  );
  const usarDueno = d => { setDueno(d); set('owner', d.owner); set('tel', d.tel || ''); };
  const cambiarTipoDueno = existente => {
    setDuenoExistente(existente);
    setDueno(null); set('owner', ''); set('tel', '');
  };

  return (
    <div style={{marginBottom:14,padding:12,background:C.mentaSuave,borderRadius:12}}>
      <div style={tituloStyle}>{isEdit ? 'Reasignar perro (opcional)' : '¿Qué perro viene?'}</div>
      {!isEdit && (
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>onMode('exist')} style={{flex:1}}>Ya vino antes</Btn>
          <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>onMode('new')} style={{flex:1}}>Perro nuevo</Btn>
        </div>
      )}
      {(mode==='exist' || isEdit) && (
        <FormGroup label="Buscar perro">
          <input type="search" value={q} placeholder="Nombre del perro, dueño o teléfono…" aria-label="Buscar cliente" style={{...inputStyle,marginBottom:6}}
            onChange={e => {
              setQ(e.target.value);
              const n = normalizar(e.target.value);
              const hits = n ? clientes.filter(c => normalizar(`${c.dog} ${c.owner} ${c.tel}`).includes(n)) : [];
              if (hits.length === 1) elegir(String(hits[0].id));
            }} />
          <select value={form.clientId} onChange={e=>elegir(e.target.value)} style={inputStyle}>
            <option value="">{isEdit ? '— Sin cambios —' : visibles.length === clientes.length ? '— Seleccionar —' : `— ${visibles.length} coinciden —`}</option>
            {visibles.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
          </select>
        </FormGroup>
      )}
      {!isEdit && mode==='new' && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div role="group" aria-label="Dueño" style={{display:'flex',gap:6,fontSize:14,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{color:C.tintaSuave}}>El dueño:</span>
            {[[false,'es nuevo'],[true,'ya es cliente']].map(([v, label]) => (
              <button key={label} type="button" aria-pressed={duenoExistente===v} onClick={()=>cambiarTipoDueno(v)} style={{
                height:32,padding:'0 12px',borderRadius:999,fontFamily:'inherit',fontSize:14,cursor:'pointer',
                background:duenoExistente===v?'white':'transparent',fontWeight:duenoExistente===v?600:400,color:C.tinta,
                border:duenoExistente===v?`1.5px solid ${C.mentaBorde}`:`1px solid ${C.lineaFuerte}`,
              }}>{label}</button>
            ))}
          </div>
          {duenoExistente && (
            <DuenoPicker clientes={clientes} elegido={dueno} onElegir={usarDueno} onLimpiar={() => { setDueno(null); set('owner',''); set('tel',''); }} />
          )}
          <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10}}>
            <FormGroup label="Nombre del perro">{field('dog','Ej: Coco')}</FormGroup>
            <FormGroup label="Raza">{field('raza','Caniche')}</FormGroup>
            {!duenoExistente && <>
              <FormGroup label="Dueño">{field('owner','Ej: María García')}</FormGroup>
              <FormGroup label="Teléfono">{field('tel','11-xxxx-xxxx')}</FormGroup>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
