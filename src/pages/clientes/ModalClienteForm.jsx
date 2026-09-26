import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import { inputStyle } from '../../lib/styles';
import FotoPicker from './FotoPicker';

const EMPTY = {dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null};
const row = {display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10};

export default function ModalClienteForm({ open, onClose, onSave, initial }) {
  // Se monta con `key` (ver AppModals): arranca de cero en cada apertura, sin efectos.
  const [form, setForm] = useState(() => initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleFoto = f => {
    setFotoFile(f);
    const r = new FileReader();
    r.onload = ev => set('foto', ev.target.result);
    r.readAsDataURL(f);
  };
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave(form, fotoFile);
    setSaving(false);
  };
  const field = (k, placeholder) => (
    <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder} style={inputStyle} />
  );

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={initial?'Editar Cliente':'Nuevo Cliente'} subtitle={!initial?'Registrá a un nuevo perrito y su dueño':''} onClose={onClose} />
      <div style={{padding:'18px 22px'}}>
        <FotoPicker foto={form.foto} isEdit={!!initial} onFile={handleFoto} />
        <div style={row}>
          <FormGroup label="Nombre del perro *">{field('dog','Coco')}</FormGroup>
          <FormGroup label="Raza">{field('raza','Caniche')}</FormGroup>
        </div>
        <div style={row}>
          <FormGroup label="Tamaño">
            <select value={form.size} onChange={e=>set('size',e.target.value)} style={inputStyle}>
              <option value="">—</option><option>Pequeño</option><option>Mediano</option><option>Grande</option>
            </select>
          </FormGroup>
          <FormGroup label="Color / pelaje">{field('pelaje','Blanco rizado')}</FormGroup>
        </div>
        <div style={row}>
          <FormGroup label="Dueño *">{field('owner','María García')}</FormGroup>
          <FormGroup label="Teléfono">{field('tel','11-2345-6789')}</FormGroup>
        </div>
        <FormGroup label="Notas especiales">
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Alergias, comportamiento, cuidados especiales..." style={{...inputStyle,resize:'vertical',minHeight:68}} />
        </FormGroup>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={handleSave} disabled={saving} style={{flex:1,justifyContent:'center'}}>
            {saving ? 'Guardando…' : `${initial?'Guardar cambios':'Guardar cliente'}`}
          </Btn>
          {!initial && <Btn variant="ghost" onClick={() => setForm(EMPTY)}>Limpiar</Btn>}
        </div>
      </div>
    </Modal>
  );
}
