import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';

// De qué está hecho un número de Finanzas: el total arriba (sin tener que sumar) y la lista (cobros, gastos, perros).
// Cada fila: { key, titulo, sub, monto?, valor? (texto en lugar del monto), signo?, onClick? }.
export default function DetalleModal({ detalle, onClose }) {
  if (!detalle) return null;
  const { titulo, subtitulo, filas, total, vacio } = detalle;
  return (
    <Modal open onClose={onClose} width={520}>
      <ModalHead title={titulo} subtitle={subtitulo} onClose={onClose} />
      <div style={{padding:'6px 22px 18px'}}>
        {total && (
          <div style={{display:'flex',alignItems:'baseline',gap:10,padding:'12px 0',borderBottom:`2px solid ${C.lineaFuerte}`,fontSize:16}}>
            <span style={{flex:1,fontWeight:600}}>{total.label}</span>
            <strong style={{fontSize:22}}>{total.valor ?? fmtPeso(total.monto)}</strong>
          </div>
        )}
        {!filas.length && <p style={{fontSize:14,color:C.tintaSuave,padding:'16px 0'}}>{vacio}</p>}
        {filas.map(f => {
          const Tag = f.onClick ? 'button' : 'div';
          return (
            <Tag key={f.key} type={f.onClick ? 'button' : undefined} onClick={f.onClick}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 0',border:'none',borderBottom:`1px solid ${C.linea}`,background:'transparent',font:'inherit',color:C.tinta,textAlign:'left',cursor:f.onClick?'pointer':undefined}}>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:'block',fontSize:15,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.titulo}</span>
                {f.sub && <span style={{display:'block',fontSize:13,color:C.tintaSuave}}>{f.sub}</span>}
              </span>
              <strong style={{fontSize:15,whiteSpace:'nowrap'}}>{f.valor ?? `${f.signo || ''}${fmtPeso(f.monto)}`}</strong>
              {f.onClick && <span style={{color:C.tintaSuave,display:'flex'}}><Icon name="right" size={16} strokeWidth={2} /></span>}
            </Tag>
          );
        })}
      </div>
    </Modal>
  );
}
