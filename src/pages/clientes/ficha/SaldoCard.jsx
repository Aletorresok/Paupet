import Icon from '../../../components/ui/Icon';
import { textoMovimiento } from '../../../lib/saldo';
import { C } from '../../../lib/styles';
import { fmtFecha, fmtPeso } from '../../../lib/utils';

const boton = {height:44,padding:'0 16px',borderRadius:12,fontFamily:'inherit',fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6};

// Señas y saldo a favor del perro: cuánto tiene, cargar una seña, devolver y los últimos movimientos.
// Los descuentos ("Descontado en un cobro") salen de borrar/deshacer la visita, por eso no tienen ✕.
export default function SaldoCard({ cliente: c, sinTurno, onCargar, onDevolver, onBorrar, onDarTurno }) {
  const movs = [...(c.movimientos || [])].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.id - a.id);
  const saldo = c.saldo || 0;
  return (
    <>
      <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
        <span style={{fontSize:30,fontWeight:600,fontVariantNumeric:'tabular-nums',color:saldo > 0 ? '#1F6B50' : C.tinta}}>{fmtPeso(saldo)}</span>
        <span style={{fontSize:14,color:C.tintaSuave}}>{saldo > 0 ? 'a favor · se descuenta en el próximo cobro' : 'sin saldo a favor'}</span>
      </div>
      {saldo > 0 && sinTurno && (
        <div style={{display:'flex',gap:10,alignItems:'center',background:C.ambarSuave,color:'#5E3900',borderRadius:12,padding:'10px 14px',fontSize:14,flexWrap:'wrap'}}>
          <Icon name="calendar" />
          <span style={{flex:1,minWidth:160}}>Pagó por adelantado y todavía no tiene turno.</span>
          <button type="button" onClick={onDarTurno} style={{height:36,padding:'0 14px',borderRadius:10,border:'none',background:C.menta,color:C.sobreMenta,fontWeight:600,fontFamily:'inherit',fontSize:14,cursor:'pointer'}}>Dar turno</button>
        </div>
      )}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button type="button" onClick={onCargar} style={{...boton,border:'none',background:C.menta,color:C.sobreMenta}}><Icon name="plus" strokeWidth={2} />Cargar seña</button>
        {saldo > 0 && <button type="button" onClick={onDevolver} style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>Devolver</button>}
      </div>
      {movs.length > 0 && (
        <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column'}}>
          {movs.slice(0, 6).map(m => (
            <li key={m.id} style={{display:'flex',alignItems:'center',gap:10,minHeight:44,borderTop:`1px solid ${C.linea}`,fontSize:14}}>
              <span style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{textoMovimiento(m)}</span>
                <span style={{fontSize:12,color:C.tintaSuave}}>{fmtFecha(m.fecha)}{m.tipo === 'sena' ? ` · ${m.forma_pago === 'transferencia' ? 'transferencia' : 'efectivo'}` : ''}</span>
              </span>
              <strong style={{fontVariantNumeric:'tabular-nums',color:m.monto > 0 ? '#1F6B50' : C.tintaSuave}}>{m.monto > 0 ? '+' : '−'}{fmtPeso(Math.abs(m.monto))}</strong>
              {m.tipo !== 'uso'
                ? <button type="button" onClick={() => onBorrar(m.id)} aria-label="Borrar este movimiento" style={{width:36,height:36,border:'none',background:'none',color:C.tintaSuave,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="x" size={16} /></button>
                : <span style={{width:36}} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
