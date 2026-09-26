import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import PetAvatar from '../../components/ui/PetAvatar';
import { calcFrecuencia, fmtCada } from '../../lib/frecuencia';
import { C, inputStyle } from '../../lib/styles';
import { fmtFecha, fmtPeso } from '../../lib/utils';
import { fechaSugerida } from './ayudaTurno';

const MEDIOS = [{id:'efectivo',label:'Efectivo'},{id:'transferencia',label:'Transferencia'}];

// "Completar y cobrar": se confirma qué se hizo, cuánto se cobró (a mano) y cómo pagó.
// Se monta con `key` = id del turno, así el formulario arranca de cero en cada turno.
// `tieneProximo`: el cliente ya tiene otro turno agendado (entonces no se sugiere uno nuevo).
export default function ModalCobro({ turno: t, cliente: c, tieneProximo = false, onClose, onCobrar, onNoVino }) {
  const [servicio, setServicio] = useState(t.servicio || '');
  const [monto, setMonto] = useState(t.precio ? String(t.precio) : '');
  const [medio, setMedio] = useState(t.forma_pago || 'efectivo');
  const [guardando, setGuardando] = useState(false);
  const frec = calcFrecuencia(c.visitas);
  // Próxima vuelta sugerida: según su frecuencia, o a 4 semanas si todavía no hay datos.
  const proxima = fechaSugerida(t.fecha, frec ? frec.cadaDias : 28);
  const [agendar, setAgendar] = useState(!!frec && !tieneProximo && !!t.clientId);
  const precio = parseFloat(String(monto).replace(/\./g, '').replace(',', '.')) || 0;

  const cobrar = async () => {
    if (guardando) return;
    setGuardando(true);
    await onCobrar(t.id, { servicio: servicio.trim() || t.servicio, precio, formaPago: medio, agendarProximo: agendar ? proxima : null });
    setGuardando(false);
  };

  return (
    <Modal open onClose={onClose} width={540}>
      <ModalHead
        title={`Completar turno de ${t.dogName || c.dog || ''}`}
        subtitle={`${fmtFecha(t.fecha)} · ${t.hora || ''} · ${c.owner || ''}`}
        onClose={onClose}
        avatar={<PetAvatar cliente={c} size={56} />}
      />
      <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:18}}>
        <FormGroup label="Qué se le hizo">
          <input value={servicio} onChange={e=>setServicio(e.target.value)} style={inputStyle} />
        </FormGroup>

        <FormGroup label="Monto a cobrar">
          <div style={{display:'flex',alignItems:'center',gap:6,height:60,padding:'0 16px',borderRadius:14,border:`2px solid ${C.mentaBorde}`}}>
            <span style={{fontSize:26,fontWeight:600,color:C.tintaSuave}}>$</span>
            <input inputMode="numeric" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0" aria-label="Monto"
              style={{border:'none',outline:'none',fontFamily:'inherit',fontSize:28,fontWeight:600,flex:1,minWidth:0,color:C.tinta,background:'transparent'}} />
          </div>
          <span style={{fontSize:13,color:C.tintaSuave}}>Viene del precio del turno. Cambialo si hace falta.</span>
        </FormGroup>

        <div role="group" aria-label="Cómo pagó" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {MEDIOS.map(m => {
            const sel = medio === m.id;
            return (
              <button key={m.id} type="button" aria-pressed={sel} onClick={()=>setMedio(m.id)} style={{
                height:52,borderRadius:12,fontFamily:'inherit',fontSize:16,fontWeight:500,cursor:'pointer',
                background:sel?C.mentaSuave:'white',color:sel?'#173F31':C.tinta,
                border:sel?`2px solid ${C.mentaBorde}`:`1px solid ${C.linea}`,
              }}>{m.label}</button>
            );
          })}
        </div>

        {frec && (
          <div style={{display:'flex',gap:10,alignItems:'center',background:C.mentaSuave,color:'#173F31',borderRadius:12,padding:'12px 14px',fontSize:14}}>
            <Icon name="repeat" />
            <span><strong>{t.dogName || c.dog} viene cada {fmtCada(frec.cadaDias)}.</strong> Te aviso en el panel cuando se acerque su próxima vuelta.</span>
          </div>
        )}
        {t.clientId && !tieneProximo && (
          <label style={{display:'flex',gap:10,alignItems:'center',fontSize:14,cursor:'pointer'}}>
            <input type="checkbox" checked={agendar} onChange={e=>setAgendar(e.target.checked)} style={{width:20,height:20,accentColor:C.mentaBorde,WebkitAppearance:'checkbox'}} />
            <span>Después, agendar el próximo turno: <strong>{fmtFecha(proxima)}</strong>{!frec && ' (a 4 semanas)'}</span>
          </label>
        )}
      </div>
      <div style={{display:'flex',gap:10,padding:'14px 22px 20px',borderTop:`1px solid ${C.linea}`,flexWrap:'wrap'}}>
        <Btn variant="danger" onClick={()=>onNoVino(t.id)}>No vino</Btn>
        <span style={{flex:1}}/>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={cobrar} disabled={guardando}>{guardando ? 'Guardando…' : `Cobrar ${fmtPeso(precio)}`}</Btn>
      </div>
    </Modal>
  );
}
