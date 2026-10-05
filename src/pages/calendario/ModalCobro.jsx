import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import PetAvatar from '../../components/ui/PetAvatar';
import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { ultimaVisita } from './ayudaTurno';
import CobroHecho from './CobroHecho';
import TecladoMonto from './TecladoMonto';

const pagar = {height:64,borderRadius:16,border:'none',fontFamily:'inherit',fontSize:18,fontWeight:600,cursor:'pointer'};

// Cobrar: se escribe el monto (arranca vacío; precio siempre a mano) y tocar Efectivo o Transferencia
// guarda. Después, en la misma ventana, "¡Cobrado!" con Deshacer y el próximo turno (`CobroHecho`).
// Se monta con `key` = id del turno, así arranca de cero en cada turno.
// `tieneProximo`: el cliente ya tiene otro turno agendado (entonces no se sugiere uno nuevo).
export default function ModalCobro({ turno: t, cliente: c, turnos, tieneProximo = false, onClose, onCobrar, onDeshacer, onAgendar, onNoVino }) {
  const [servicio, setServicio] = useState(t.servicio || '');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(null);
  const [hecho, setHecho] = useState(null); // { visitaId, antes, precio, medio } después de cobrar
  const nombre = t.dogName || c.dog || '';
  const precio = parseInt(monto || '0', 10);
  const ultima = ultimaVisita(c);

  const cobrar = async medio => {
    if (!precio || guardando) return;
    setGuardando(medio);
    const r = await onCobrar(t.id, { servicio: servicio.trim() || t.servicio, precio, formaPago: medio });
    setGuardando(null);
    if (r) setHecho({ ...r, precio, medio });
  };
  const deshacer = async () => { if (await onDeshacer(t.id, hecho)) setHecho(null); };

  return (
    <Modal open onClose={onClose} width={440}>
      <div style={{padding:'18px 20px 22px',display:'flex',flexDirection:'column',gap:14}}>
        <header style={{display:'flex',alignItems:'center',gap:12}}>
          <PetAvatar cliente={c} size={48} />
          <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
            <span style={{fontSize:20,fontWeight:600}}>Cobrar a {nombre} ✂️</span>
            {hecho ? (
              <span style={{fontSize:14,color:C.tintaSuave}}>{[servicio, c.owner].filter(Boolean).join(' · ')}</span>
            ) : (
              <span style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:C.tintaSuave,minWidth:0}}>
                <input value={servicio} onChange={e => setServicio(e.target.value)} aria-label="Qué se le hizo" placeholder="Qué se le hizo"
                  style={{width:`calc(${Math.max(servicio.length, 8)}ch * .82)`,minWidth:0,maxWidth:'70%',border:'none',borderBottom:`1px dashed ${C.lineaFuerte}`,padding:'2px 0',fontFamily:'inherit',fontSize:14,color:C.tinta,background:'transparent',outline:'none'}} />
                {c.owner && <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>· {c.owner}</span>}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{width:44,height:44,borderRadius:14,border:'none',background:'transparent',color:C.tinta,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Icon name="x" size={22} strokeWidth={2} />
          </button>
        </header>

        {hecho ? (
          <CobroHecho turno={t} cliente={c} turnos={turnos} tieneProximo={tieneProximo} hecho={hecho} servicio={servicio.trim() || t.servicio}
            onDeshacer={deshacer} onAgendar={datos => onAgendar(t, datos)} onClose={onClose} />
        ) : (
          <>
            <TecladoMonto monto={monto} onChange={setMonto} ultimo={ultima?.precio > 0 && (
              <button type="button" onClick={() => setMonto(String(ultima.precio))}
                style={{height:44,borderRadius:999,border:'1px solid #D9D5CE',background:'white',fontFamily:'inherit',fontSize:14,fontWeight:500,color:C.tinta,cursor:'pointer'}}>
                Igual que la última vez · {fmtPeso(ultima.precio)}
              </button>
            )} />
            <div role="group" aria-label="Cómo pagó (guarda el cobro)" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:2}}>
              <button type="button" aria-disabled={!precio} onClick={() => cobrar('efectivo')}
                style={{...pagar,background:C.menta,color:C.sobreMenta,opacity:precio ? 1 : .45}}>
                {guardando === 'efectivo' ? 'Guardando…' : 'Efectivo'}
              </button>
              <button type="button" aria-disabled={!precio} onClick={() => cobrar('transferencia')}
                style={{...pagar,background:'#1F2A26',color:'white',opacity:precio ? 1 : .45}}>
                {guardando === 'transferencia' ? 'Guardando…' : 'Transferencia'}
              </button>
            </div>
            <button type="button" onClick={() => onNoVino(t.id)}
              style={{alignSelf:'center',height:44,padding:'0 12px',border:'none',background:'none',fontFamily:'inherit',fontSize:15,fontWeight:600,color:'#8E2A4A',cursor:'pointer'}}>
              No vino
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
