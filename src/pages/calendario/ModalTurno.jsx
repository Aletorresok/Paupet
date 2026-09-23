import { useState, useEffect } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import PagoSelect from '../../components/ui/PagoSelect';
import { inputStyle } from '../../lib/styles';
import { fmtFecha, todayStr } from '../../lib/utils';
import ClienteSelector from './ClienteSelector';

const EMPTY_CLIENTE = {clientId:'',dog:'',owner:'',raza:'',tel:''};

export default function ModalTurno({ open, onClose, onSave, onUpdate, clientes, defaultFecha, turnoEdit }) {
  const { isMob } = useResp();
  const isEdit = !!turnoEdit;
  const [mode, setMode] = useState('exist');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({...EMPTY_CLIENTE,svc:'',fecha:defaultFecha||todayStr(),hora:'10:00',precio:'',formaPago:'efectivo',estado:'confirmed'});

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      setForm({
        ...EMPTY_CLIENTE,
        clientId: String(turnoEdit.clientId || ''),
        svc:    turnoEdit.servicio || '',
        fecha:  turnoEdit.fecha    || todayStr(),
        hora:   turnoEdit.hora     || '10:00',
        precio: String(turnoEdit.precio || ''),
        formaPago: turnoEdit.forma_pago || 'efectivo',
        estado: turnoEdit.estado   || 'confirmed',
      });
    } else {
      setForm(f => ({...f, ...EMPTY_CLIENTE, fecha:defaultFecha||todayStr(), svc:'', hora:'10:00', precio:'', formaPago:'efectivo', estado:'confirmed'}));
    }
    setMode('exist');
  }, [open, isEdit, turnoEdit, defaultFecha]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleGuardar = async () => {
    if (saving) return;
    setSaving(true);
    if (isEdit) {
      const clienteSeleccionado = clientes.find(x => x.id === parseInt(form.clientId));
      await onUpdate(turnoEdit.id, {
        servicio: form.svc,
        fecha:    form.fecha,
        hora:     form.hora,
        precio:   parseFloat(form.precio) || 0,
        forma_pago: form.formaPago,
        estado:   form.estado,
        clientId: form.clientId ? parseInt(form.clientId) : turnoEdit.clientId,
        dogName:  clienteSeleccionado ? clienteSeleccionado.dog : turnoEdit.dogName,
      });
    } else {
      await onSave(mode, form);
    }
    setSaving(false);
  };

  const grid = {display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10};

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead
        title={isEdit ? '✏️ Editar Turno' : 'Agregar Turno'}
        subtitle={isEdit ? `${turnoEdit?.dogName || ''} — ${fmtFecha(turnoEdit?.fecha)}` : ''}
        onClose={onClose}
      />
      <div style={{padding:'18px 22px'}}>
        <ClienteSelector isEdit={isEdit} mode={mode} onMode={setMode} form={form} set={set} clientes={clientes} />

        <div style={grid}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={grid}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Precio ($)"><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
        </div>
        <div style={grid}>
          <FormGroup label="Forma de pago"><PagoSelect value={form.formaPago} onChange={v=>set('formaPago',v)} /></FormGroup>
          <FormGroup label="Estado">
            <select value={form.estado} onChange={e=>set('estado',e.target.value)} style={inputStyle}>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
            </select>
          </FormGroup>
        </div>

        <Btn onClick={handleGuardar} disabled={saving} style={{width:'100%',justifyContent:'center',marginTop:6}}>
          {saving ? '⏳ Guardando...' : isEdit ? '✓ Guardar cambios' : '✓ Guardar turno'}
        </Btn>
      </div>
    </Modal>
  );
}
