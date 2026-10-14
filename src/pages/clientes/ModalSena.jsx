import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import PetAvatar from '../../components/ui/PetAvatar';
import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import TecladoMonto from '../calendario/TecladoMonto';

const pagar = {height:64,borderRadius:16,border:'none',fontFamily:'inherit',fontSize:18,fontWeight:600,cursor:'pointer'};

// Cargar una seña o un pago adelantado (p. ej. "me pagó un corte por adelantado"). Se escribe el monto con el
// teclado y tocar Efectivo o Transferencia guarda. La plata queda como saldo a favor del perro y se descuenta
// sola en su próximo cobro. Se monta con `key` (ver AppModals) para arrancar de cero.
// `turno`: si se carga desde un turno, la seña queda atada a él (para mostrarla ahí).
export default function ModalSena({ cliente: c, turno, onClose, onGuardar }) {
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(null);
  const importe = parseInt(monto || '0', 10);

  const guardar = async medio => {
    if (!importe || guardando) return;
    setGuardando(medio);
    const ok = await onGuardar({ clienteId: c.id, monto: importe, formaPago: medio, turnoId: turno?.id ?? null, nota: nota.trim() });
    setGuardando(null);
    if (ok) onClose();
  };

  return (
    <Modal open onClose={onClose} width={440}>
      <div style={{padding:'18px 20px 22px',display:'flex',flexDirection:'column',gap:14}}>
        <header style={{display:'flex',alignItems:'center',gap:12}}>
          <PetAvatar cliente={c} size={48} />
          <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
            <span style={{fontSize:20,fontWeight:600}}>Seña de {c.dog} 💚</span>
            <span style={{fontSize:14,color:C.tintaSuave}}>
              {c.owner}{c.saldo > 0 ? ` · ya tiene ${fmtPeso(c.saldo)} a favor` : ''}{turno ? ` · turno del ${turno.fecha.split('-').reverse().slice(0, 2).join('/')}` : ''}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{width:44,height:44,borderRadius:14,border:'none',background:'transparent',color:C.tinta,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Icon name="x" size={22} strokeWidth={2} />
          </button>
        </header>

        <TecladoMonto monto={monto} onChange={setMonto} />
        <input value={nota} onChange={e => setNota(e.target.value)} aria-label="Para qué es (opcional)" placeholder="Para qué es (opcional) · ej. un corte"
          style={{height:46,borderRadius:12,border:`1px solid ${C.lineaFuerte}`,padding:'0 14px',fontFamily:'inherit',fontSize:15,color:C.tinta,background:'white',outline:'none'}} />
        <div role="group" aria-label="Cómo pagó (guarda la seña)" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
          <button type="button" aria-disabled={!importe} onClick={() => guardar('efectivo')}
            style={{...pagar,background:C.menta,color:C.sobreMenta,opacity:importe ? 1 : .45}}>
            {guardando === 'efectivo' ? 'Guardando…' : 'Efectivo'}
          </button>
          <button type="button" aria-disabled={!importe} onClick={() => guardar('transferencia')}
            style={{...pagar,background:'#1F2A26',color:'white',opacity:importe ? 1 : .45}}>
            {guardando === 'transferencia' ? 'Guardando…' : 'Transferencia'}
          </button>
        </div>
        <p style={{margin:0,textAlign:'center',fontSize:13,color:C.tintaSuave}}>Queda como saldo a favor y se descuenta sola en el próximo cobro.</p>
      </div>
    </Modal>
  );
}
