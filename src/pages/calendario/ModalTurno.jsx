import { useMemo, useState } from 'react';
import FormGroup from '../../components/ui/FormGroup';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import { DURACIONES, fmtDuracion } from '../../lib/duracion';
import { horariosLibresPau } from '../../lib/huecosLibres';
import { C, inputStyle } from '../../lib/styles';
import { fmtFecha, todayStr } from '../../lib/utils';
import { duracionSugerida, etiquetaDia, libresPorDia, rangoTurno, serviciosFrecuentes, turnosQueSePisan, ultimaVisita } from './ayudaTurno';
import PasoCuando from './turno/PasoCuando';
import PasoPerro from './turno/PasoPerro';
import PasoServicio from './turno/PasoServicio';

const EMPTY_CLIENTE = {clientId:'',dog:'',owner:'',raza:'',tel:'',size:'',notes:''};

// Nuevo turno en 3 toques: 1 · Perro → 2 · Servicio → 3 · Cuándo (maqueta `Turno.dc.html`). Siempre queda
// confirmado y en efectivo (se cobra después). Precio y duración van en "Más opciones"; la duración sale sola
// (`duracionSugerida`) hasta que se la cambia. También sirve para editar un turno.
// Se monta con `key` (ver AppModals): arranca de cero en cada apertura, sin efectos.
// `defaultNuevo` = {dog, owner, raza, tel, size, notes}: perro nuevo ya cargado (p. ej. desde un pedido de /turnos).
// `pedidoId`: al guardar, ese pedido queda aceptado.
export default function ModalTurno({ open, onClose, onSave, onUpdate, clientes, turnos = [], config, defaultFecha, defaultHora, defaultClientId, defaultServicio, defaultDuracion, defaultNuevo, pedidoId, turnoEdit }) {
  const isEdit = !!turnoEdit;
  const [nuevo, setNuevo] = useState(!isEdit && !!defaultNuevo);
  const [saving, setSaving] = useState(false);
  const [masOpciones, setMasOpciones] = useState(false);
  const servicios = useMemo(() => serviciosFrecuentes(clientes, 6), [clientes]);
  const otrosTurnos = useMemo(() => turnos.filter(t => t.id !== turnoEdit?.id), [turnos, turnoEdit]);
  const libres = useMemo(() => horariosLibresPau(config, otrosTurnos), [config, otrosTurnos]);

  const [form, setForm] = useState(() => {
    if (isEdit) return {
      ...EMPTY_CLIENTE, clientId: String(turnoEdit.clientId || ''), svc: turnoEdit.servicio || '',
      fecha: turnoEdit.fecha || todayStr(), hora: turnoEdit.hora || '', precio: String(turnoEdit.precio || ''),
    };
    const c = defaultClientId && clientes.find(x => x.id === Number(defaultClientId));
    return {
      ...EMPTY_CLIENTE, ...defaultNuevo, clientId: defaultClientId ? String(defaultClientId) : '',
      svc: defaultServicio || ultimaVisita(c)?.servicio || '',
      // Sin fecha pedida: el primer día con horarios libres (o hoy).
      fecha: defaultFecha || libres[0]?.fecha || todayStr(), hora: defaultHora || '', precio: '', pedidoId: pedidoId || null,
    };
  });
  // Duración elegida a mano (si no, la sugerida). Al editar o si viene dada, se respeta.
  const [durManual, setDurManual] = useState(isEdit ? (turnoEdit.duracion || 60) : defaultDuracion ? Number(defaultDuracion) : null);
  const [svcManual, setSvcManual] = useState(isEdit || !!defaultServicio);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cliente = !nuevo && form.clientId ? clientes.find(c => c.id === Number(form.clientId)) : null;
  const sugerida = duracionSugerida(turnos, cliente?.id, form.svc);
  const duracion = durManual ?? sugerida;
  const comoLaUltima = durManual == null && cliente && turnos.some(t => t.clientId === cliente.id && t.duracion && (t.servicio || '').trim().toLowerCase() === form.svc.trim().toLowerCase());
  const dias = useMemo(() => libresPorDia(libres, otrosTurnos, duracion), [libres, otrosTurnos, duracion]);
  const pisados = turnosQueSePisan(otrosTurnos, { fecha: form.fecha, hora: form.hora, duracion });

  const elegirPerro = id => setForm(f => {
    const c = clientes.find(x => x.id === id);
    return { ...f, clientId: id ? String(id) : '', svc: svcManual ? f.svc : ultimaVisita(c)?.servicio || f.svc };
  });
  const elegirFecha = fecha => setForm(f => ({ ...f, fecha, hora: dias.find(d => d.fecha === fecha)?.horas.includes(f.hora) ? f.hora : '' }));

  const falta = [!(nuevo ? form.dog && form.owner : cliente) && 'el perro', !form.svc.trim() && 'el servicio', !(form.fecha && form.hora) && 'el horario'].filter(Boolean);
  const cuando = form.fecha ? `${etiquetaDia(form.fecha)}${form.hora ? ` ${form.hora}` : ''}` : '';

  const guardar = async () => {
    if (saving || falta.length) return;
    setSaving(true);
    const datos = { svc: form.svc.trim(), fecha: form.fecha, hora: form.hora, precio: form.precio, duracion };
    if (isEdit) {
      await onUpdate(turnoEdit.id, {
        servicio: datos.svc, fecha: datos.fecha, hora: datos.hora, precio: parseFloat(datos.precio) || 0, duracion,
        // Ya no hay "sin confirmar": un turno pendiente que se edita queda confirmado.
        estado: turnoEdit.estado === 'pending' ? 'confirmed' : turnoEdit.estado,
        clientId: cliente ? cliente.id : turnoEdit.clientId, dogName: cliente ? cliente.dog : turnoEdit.dogName,
      });
    } else {
      await onSave(nuevo ? 'new' : 'exist', { ...form, ...datos, estado: 'confirmed', formaPago: 'efectivo' });
    }
    setSaving(false);
  };

  const subtitulo = isEdit ? `${turnoEdit.dogName || ''} · ${fmtFecha(turnoEdit.fecha)}` : pedidoId ? 'Cargado desde el pedido: revisá y agendá' : '';
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{padding:'16px 20px 0',display:'flex',flexDirection:'column',gap:18}}>
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{display:'flex',flexDirection:'column',minWidth:0}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:600}}>{isEdit ? 'Editar turno' : 'Nuevo turno'}</h2>
            {subtitulo && <span style={{fontSize:14,color:C.tintaSuave}}>{subtitulo}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{width:44,height:44,borderRadius:14,border:'none',background:'transparent',color:C.tinta,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Icon name="x" size={22} strokeWidth={2} />
          </button>
        </header>

        <PasoPerro clientes={clientes} cliente={cliente} onElegir={elegirPerro} nuevo={nuevo} onNuevo={isEdit ? null : setNuevo} form={form} set={set} />
        <PasoServicio servicios={servicios} valor={form.svc} onElegir={s => { setSvcManual(true); set('svc', s); }} />
        <PasoCuando dias={dias} fecha={form.fecha} hora={form.hora} onFecha={elegirFecha} onHora={h => set('hora', h)}
          notaDuracion={`Dura ${fmtDuracion(duracion)}${comoLaUltima ? ', como la última vez' : ''}.`} />

        {pisados.length > 0 && (
          <div role="status" style={{padding:'10px 12px',borderRadius:10,background:C.rosaSuave,color:C.rosa,fontSize:13,fontWeight:500}}>
            Se pisa con {pisados.map(t => `${t.dogName || 'un turno'} (${rangoTurno(t)})`).join(', ')}. Se puede guardar igual.
          </div>
        )}

        <div>
          <button type="button" aria-expanded={masOpciones} onClick={() => setMasOpciones(v => !v)}
            style={{height:44,display:'flex',alignItems:'center',gap:6,border:'none',background:'none',padding:0,fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.tintaSuave,cursor:'pointer'}}>
            <Icon name="right" size={16} style={{transform:masOpciones ? 'rotate(90deg)' : 'none',transition:'transform .15s'}} />
            Más opciones · precio{form.precio ? ` $${Number(form.precio).toLocaleString('es-AR')}` : ''} y duración ({fmtDuracion(duracion)})
          </button>
          {masOpciones && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:4}}>
              <FormGroup label="Precio ($)"><input type="number" inputMode="numeric" value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="Se pone al cobrar" style={inputStyle} /></FormGroup>
              <FormGroup label="Duración">
                <select value={duracion} onChange={e => setDurManual(Number(e.target.value))} style={inputStyle}>
                  {[...new Set([...DURACIONES, duracion])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{fmtDuracion(m)}</option>)}
                </select>
              </FormGroup>
            </div>
          )}
        </div>
      </div>

      <div style={{position:'sticky',bottom:0,background:'white',padding:'12px 20px 20px',display:'flex',flexDirection:'column',gap:6}}>
        <button type="button" onClick={guardar} aria-disabled={!!falta.length || saving}
          style={{height:56,borderRadius:14,border:'none',background:C.menta,color:C.sobreMenta,fontFamily:'inherit',fontSize:17,fontWeight:600,cursor:'pointer',opacity:falta.length ? .5 : 1}}>
          {saving ? 'Guardando…' : `${isEdit ? 'Guardar' : 'Agendar'}${cuando ? ` · ${cuando}` : ''}`}
        </button>
        <span style={{textAlign:'center',fontSize:13,color:C.tintaSuave}}>
          {falta.length ? `Falta elegir ${falta.join(', ').replace(/, ([^,]*)$/, ' y $1')}` : isEdit ? '' : 'El día anterior te aparece en Avisos para recordarle 💬'}
        </span>
      </div>
    </Modal>
  );
}
