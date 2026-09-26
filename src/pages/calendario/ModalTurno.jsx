import { useState, useMemo } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import PagoSelect from '../../components/ui/PagoSelect';
import { C, inputStyle } from '../../lib/styles';
import { fmtFecha, todayStr } from '../../lib/utils';
import ClienteSelector from './ClienteSelector';
import { DURACIONES, fmtDuracion } from '../../lib/duracion';
import ClienteResumen from './ClienteResumen';
import { serviciosFrecuentes, turnosQueSePisan, rangoTurno } from './ayudaTurno';

const EMPTY_CLIENTE = {clientId:'',dog:'',owner:'',raza:'',tel:'',size:'',notes:''};

// `defaultNuevo` = {dog, owner, raza, tel, size, notes}: perro nuevo ya cargado (p. ej. desde un pedido de /turnos).
// `pedidoId`: al guardar, ese pedido queda aceptado.
export default function ModalTurno({ open, onClose, onSave, onUpdate, clientes, turnos = [], defaultFecha, defaultHora, defaultClientId, defaultServicio, defaultDuracion, defaultNuevo, pedidoId, turnoEdit }) {
  const { isMob } = useResp();
  const isEdit = !!turnoEdit;
  const [mode, setMode] = useState(!isEdit && defaultNuevo ? 'new' : 'exist');
  const [saving, setSaving] = useState(false);
  // Se monta con `key` (ver AppModals): el formulario arranca de cero en cada apertura, sin efectos.
  const [form, setForm] = useState(() => isEdit ? {
    ...EMPTY_CLIENTE,
    clientId: String(turnoEdit.clientId || ''),
    svc:    turnoEdit.servicio || '',
    fecha:  turnoEdit.fecha    || todayStr(),
    hora:   turnoEdit.hora     || '10:00',
    precio: String(turnoEdit.precio || ''),
    formaPago: turnoEdit.forma_pago || 'efectivo',
    estado: turnoEdit.estado   || 'confirmed',
    duracion: turnoEdit.duracion || 60,
  } : {
    ...EMPTY_CLIENTE, ...defaultNuevo, clientId: defaultClientId ? String(defaultClientId) : '', fecha:defaultFecha||todayStr(), svc:defaultServicio||'',
    hora:defaultHora||'10:00', precio:'', formaPago:'efectivo', estado:'confirmed', duracion:defaultDuracion||60, pedidoId: pedidoId || null,
  });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const servicios = useMemo(() => serviciosFrecuentes(clientes), [clientes]);
  const clienteSel = (mode === 'exist' || isEdit) && form.clientId ? clientes.find(c => c.id === parseInt(form.clientId)) : null;
  const pisados = turnosQueSePisan(turnos, { fecha: form.fecha, hora: form.hora, duracion: form.duracion, excluirId: turnoEdit?.id });

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
        duracion: Number(form.duracion) || 60,
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
        title={isEdit ? 'Editar turno' : 'Nuevo turno'}
        subtitle={isEdit ? `${turnoEdit?.dogName || ''} — ${fmtFecha(turnoEdit?.fecha)}` : pedidoId ? 'Cargado desde el pedido · revisá, poné el precio si querés y guardá' : ''}
        onClose={onClose}
      />
      <div style={{padding:'18px 22px'}}>
        <ClienteSelector isEdit={isEdit} mode={mode} onMode={setMode} form={form} set={set} clientes={clientes} />
        <ClienteResumen cliente={clienteSel} onUsarUltima={(svc, precio) => setForm(f => ({...f, svc, precio: String(precio || '')}))} />

        <div style={grid}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" list="servicios-frecuentes" style={inputStyle} />
            <datalist id="servicios-frecuentes">{servicios.map(s => <option key={s} value={s} />)}</datalist></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={{...grid,gridTemplateColumns:isMob?'1fr 1fr':'1fr 1fr 1fr'}}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Duración">
            <select value={form.duracion} onChange={e=>set('duracion',e.target.value)} style={inputStyle}>
              {DURACIONES.map(m => <option key={m} value={m}>{fmtDuracion(m)}</option>)}
            </select>
          </FormGroup>
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

        {pisados.length > 0 && (
          <div role="status" style={{marginBottom:10,padding:'10px 12px',borderRadius:10,background:C.rosaSuave,color:C.rosa,fontSize:13,fontWeight:500}}>
            Se pisa con {pisados.map(t => `${t.dogName || 'un turno'} (${rangoTurno(t)})`).join(', ')}. Se puede guardar igual.
          </div>
        )}
        <Btn onClick={handleGuardar} disabled={saving} style={{width:'100%',justifyContent:'center',marginTop:6}}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar turno'}
        </Btn>
      </div>
    </Modal>
  );
}
