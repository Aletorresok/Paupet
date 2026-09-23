import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';
import { useResp } from '../../context/resp';
import { fmtFecha, fmtPeso } from '../../lib/utils';

const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
// "2026-09-20" → "20 sep"
const fechaCorta = f => { const [, m, d] = (f || '').split('-').map(Number); return d ? `${d} ${MES_CORTO[m - 1]}` : '–'; };

const iconBtn = {background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,display:'flex'};

export default function VisitaItem({ visita: v, onEdit, onDelete }) {
  const { isMob } = useResp();
  const transf = v.forma_pago === 'transferencia';
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',minHeight:56,boxSizing:'border-box',borderTop:'1px solid #F0EBE4'}}>
      <span style={{width:isMob?52:84,flexShrink:0,fontSize:14,fontWeight:600,lineHeight:1.25}}>{isMob ? fechaCorta(v.fecha) : fmtFecha(v.fecha).replace(/ de (\d{4})$/, ' $1').replace(/ \d{4}$/, '')}<br/><span style={{fontSize:12,fontWeight:400,color:C.tintaSuave}}>{(v.fecha||'').slice(0,4)}</span></span>
      <span style={{flex:1,minWidth:0,fontSize:15,display:'flex',flexDirection:'column'}}>
        {v.servicio}
        {isMob && <span style={{fontSize:12,color:C.tintaSuave}}>{transf ? 'Transferencia' : 'Efectivo'}</span>}
      </span>
      {!isMob && <Badge variant={transf ? 'blue' : 'green'}>{transf ? 'Transferencia' : 'Efectivo'}</Badge>}
      <span style={{textAlign:'right',minWidth:isMob?70:84,fontSize:15,fontWeight:600,whiteSpace:'nowrap'}}>{fmtPeso(v.precio)}</span>
      {v.id && (
        <div style={{display:'flex'}}>
          <button type="button" onClick={onEdit} aria-label="Editar visita" style={{...iconBtn,color:C.tintaSuave}}><Icon name="edit" size={16}/></button>
          <button type="button" onClick={onDelete} aria-label="Eliminar visita" style={{...iconBtn,color:C.rosa}}><Icon name="trash" size={16}/></button>
        </div>
      )}
    </div>
  );
}
