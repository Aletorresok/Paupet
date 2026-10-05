import { useState } from 'react';
import { useResp } from '../../../context/resp';
import DuenoPicker from '../../../components/ui/DuenoPicker';
import FormGroup from '../../../components/ui/FormGroup';
import { C, inputStyle } from '../../../lib/styles';

// Perro que viene por primera vez. Puede ser de un dueño nuevo o de alguien que ya es cliente
// (se copian su nombre y teléfono).
export default function PerroNuevoForm({ form, set, clientes }) {
  const { isMob } = useResp();
  const [duenoExistente, setDuenoExistente] = useState(false);
  const [dueno, setDueno] = useState(null);
  const field = (k, placeholder) => (
    <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder} style={inputStyle} />
  );
  const usarDueno = d => { setDueno(d); set('owner', d.owner); set('tel', d.tel || ''); };
  const cambiarTipoDueno = existente => {
    setDuenoExistente(existente);
    setDueno(null); set('owner', ''); set('tel', '');
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10,padding:12,background:C.mentaSuave,borderRadius:14}}>
      <div role="group" aria-label="Dueño" style={{display:'flex',gap:6,fontSize:14,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{color:C.tintaSuave}}>El dueño:</span>
        {[[false,'es nuevo'],[true,'ya es cliente']].map(([v, label]) => (
          <button key={label} type="button" aria-pressed={duenoExistente===v} onClick={()=>cambiarTipoDueno(v)} style={{
            height:36,padding:'0 12px',borderRadius:999,fontFamily:'inherit',fontSize:14,cursor:'pointer',
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
  );
}
