import { useState } from 'react';
import banio from '../../assets/ilustraciones/banio.webp';
import { DIAS_ES, MESES } from '../../lib/constants';
import { calcFrecuencia, fmtCada } from '../../lib/frecuencia';
import { C } from '../../lib/styles';
import { fmtPeso, parseFecha } from '../../lib/utils';
import { fechaSugerida, turnosQueSePisan } from './ayudaTurno';

const boton = {height:52,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit',fontSize:16,fontWeight:600,cursor:'pointer'};
const fechaLarga = f => { const d = parseFecha(f); return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; };

// Después de cobrar, en la misma ventana: "¡Cobrado $X! ✅", Deshacer y el próximo turno sugerido
// (según su frecuencia, o a 4 semanas; nunca domingo) a la misma hora.
export default function CobroHecho({ turno: t, cliente: c, turnos, tieneProximo, hecho, servicio, onDeshacer, onAgendar, onClose }) {
  const [ocupado, setOcupado] = useState(false);
  const frec = calcFrecuencia(c.visitas);
  const proxima = fechaSugerida(t.fecha, frec ? frec.cadaDias : 28);
  const pisa = turnosQueSePisan(turnos, { fecha: proxima, hora: t.hora, duracion: t.duracion });
  const sugerir = !!t.clientId && !tieneProximo;

  const deshacer = async () => { setOcupado(true); await onDeshacer(); setOcupado(false); };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'6px 0',textAlign:'center'}}>
        <img src={banio} alt="" style={{width:150,height:'auto'}} />
        <span style={{fontSize:24,fontWeight:600}}>¡Cobrado {fmtPeso(hecho.precio)}! ✅</span>
        <span style={{fontSize:15,color:C.tintaSuave}}>{hecho.medio === 'transferencia' ? 'Transferencia' : 'Efectivo'} · guardado en su historial</span>
        <button type="button" disabled={ocupado} onClick={deshacer} style={{height:44,padding:'0 12px',border:'none',background:'none',fontFamily:'inherit',fontSize:14,fontWeight:600,color:'#1F6B50',cursor:'pointer'}}>
          {ocupado ? 'Deshaciendo…' : 'Deshacer'}
        </button>
      </div>

      {sugerir ? (
        <div style={{background:'#F6F5F2',borderRadius:18,padding:16,display:'flex',flexDirection:'column',gap:12}}>
          <span style={{fontSize:13,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:C.tintaSuave}}>
            Próximo turno · {frec ? `viene cada ${fmtCada(frec.cadaDias)}` : 'en 4 semanas'}
          </span>
          <span style={{fontSize:20,fontWeight:600}}>{fechaLarga(proxima)}{t.hora ? ` · ${t.hora}` : ''}</span>
          {pisa.length > 0 && (
            <span style={{fontSize:14,color:C.ambar}}>Ojo: a esa hora ya está {pisa.map(x => x.dogName || 'otro turno').join(', ')}.</span>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
            <button type="button" onClick={onClose} style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>Ahora no</button>
            <button type="button" disabled={ocupado} onClick={() => { setOcupado(true); onAgendar({ fecha: proxima, servicio }); }}
              style={{...boton,border:'none',background:C.menta,color:C.sobreMenta}}>Agendar 📅</button>
          </div>
          <button type="button" onClick={() => onAgendar({ fecha: proxima, servicio, otro: true })}
            style={{alignSelf:'center',height:44,padding:'0 12px',border:'none',background:'none',fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.tinta,cursor:'pointer',textDecoration:'underline'}}>
            Otro día u horario
          </button>
        </div>
      ) : (
        <>
          {tieneProximo && <p style={{margin:0,textAlign:'center',fontSize:15,color:C.tintaSuave}}>Ya tiene otro turno agendado 📅</p>}
          <button type="button" onClick={onClose} style={{...boton,border:'none',background:C.menta,color:C.sobreMenta}}>Listo</button>
        </>
      )}
    </div>
  );
}
