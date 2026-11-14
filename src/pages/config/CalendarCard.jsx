import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import { URL_CALENDAR } from '../../lib/ical';
import { C, cardStyle, inputStyle, serif } from '../../lib/styles';

const hora = d => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Ajustes → Google Calendar: se pega la dirección secreta del calendario y, desde ahí, los eventos con 🐶 o la
// palabra "turno" en el título entran solos a Paupet (ver hooks/useCalendarSync.js).
export default function CalendarCard({ habilitado, calendar, sync }) {
  const [url, setUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const conectado = !!calendar?.url;
  const { estado } = sync;
  const limpia = url.trim().replace(/^webcal:/, 'https:');
  const valida = URL_CALENDAR.test(limpia);

  const conectar = async nueva => {
    setGuardando(true);
    if (await sync.conectar(nueva)) setUrl('');
    setGuardando(false);
  };

  return (
    <section aria-label="Google Calendar" style={{...cardStyle,padding:'18px 20px',marginBottom:16,display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:220}}>
          <h3 style={{margin:0,fontFamily:serif,fontSize:19,fontWeight:600}}>Google Calendar</h3>
          <p style={{margin:'4px 0 0',fontSize:14,color:C.tintaSuave}}>
            Los eventos que tengan <strong>🐶</strong> o la palabra <strong>turno</strong> en el título aparecen solos en Paupet. Lo demás (facultad, personal) no entra.
          </p>
        </div>
        {conectado && <Btn onClick={() => sync.sincronizar({ manual: true })} disabled={estado.sincronizando}><Icon name="calendar"/>{estado.sincronizando ? 'Leyendo…' : 'Sincronizar ahora'}</Btn>}
      </div>

      {!habilitado ? (
        <p style={{margin:0,fontSize:13,color:C.ambar,fontWeight:500}}>Para activarlo falta correr la migración 9 en Supabase.</p>
      ) : conectado ? (
        <>
          <p role="status" style={{margin:0,fontSize:13,fontWeight:500,color:estado.error ? C.rosa : C.verde}}>
            {estado.error ? `No se pudo leer el calendario: ${estado.error}`
              : `Conectado ✅${estado.ultima ? ` · última lectura a las ${hora(estado.ultima)}` : ''}`}
          </p>
          {estado.repetidos > 0 && (
            <p style={{margin:0,fontSize:13,color:C.ambar}}>
              Hay {estado.repetidos === 1 ? '1 turno que se repite' : `${estado.repetidos} turnos que se repiten`} en Calendar: esos todavía no se traen, cargalos en Paupet.
            </p>
          )}
          <button type="button" onClick={() => conectar('')} disabled={guardando}
            style={{alignSelf:'flex-start',background:'none',border:'none',padding:0,minHeight:44,fontFamily:'inherit',fontSize:14,fontWeight:600,color:C.rosa,cursor:'pointer'}}>
            Desconectar
          </button>
        </>
      ) : (
        <>
          <details style={{fontSize:14,color:C.tintaSuave}}>
            <summary style={{cursor:'pointer',fontWeight:600,color:C.tinta,minHeight:32}}>Dónde está la dirección secreta</summary>
            <ol style={{margin:'6px 0 0',paddingLeft:20,display:'flex',flexDirection:'column',gap:4}}>
              <li>Abrí Google Calendar en la compu (calendar.google.com).</li>
              <li>Ruedita de arriba → Configuración → a la izquierda, tocá tu calendario.</li>
              <li>Bajá hasta “Dirección secreta en formato iCal” y copiala.</li>
              <li>Pegala acá abajo. No la compartas: deja ver todo el calendario.</li>
            </ol>
          </details>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              aria-label="Dirección secreta del calendario" autoComplete="off" style={{...inputStyle,flex:'1 1 240px',minWidth:0}} />
            <Btn onClick={() => conectar(limpia)} disabled={!valida || guardando}>{guardando ? 'Conectando…' : 'Conectar'}</Btn>
          </div>
          {url.trim() && !valida && <p style={{margin:0,fontSize:13,color:C.rosa}}>Tiene que empezar con https://calendar.google.com/calendar/ical/ y terminar en basic.ics</p>}
        </>
      )}
    </section>
  );
}
