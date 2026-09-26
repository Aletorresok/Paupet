import { CAL_DAYS, DIAS_ES } from '../../lib/constants';
import { parseFecha } from '../../lib/utils';
import Chips from './Chips';
import { describirHorario } from './mensajeTurno';
import { FRANJAS } from './opciones';

// Paso "¿Cuándo te queda bien?": horarios libres de Pau o, si no hay (o ninguno sirve), texto libre.
export default function ElegirHorario({ dias, cargando, aMano, onAMano, horario, onHorario, diaVisto, onDiaVisto, franja, onFranja, preferencia, onPreferencia }) {
  if (cargando) return <p className="pt-sub">Buscando horarios libres…</p>;

  const hayHorarios = dias.length > 0;
  if (hayHorarios && !aMano) {
    // Día que se muestra: el del horario elegido, el que tocó la persona, o el primero.
    const fechaVista = diaVisto && dias.some(d => d.fecha === diaVisto) ? diaVisto : horario?.fecha || dias[0].fecha;
    const dia = dias.find(d => d.fecha === fechaVista) || dias[0];
    // Sugerencia: el primer horario libre (el más próximo).
    const sug = { fecha: dias[0].fecha, hora: dias[0].horas[0] };
    const esSug = (fecha, h) => fecha === sug.fecha && h === sug.hora;
    return (
      <>
        {!horario && (
          <div className="pt-sugerido">
            <span className="pt-sugerido-txt">El próximo turno libre es el <strong>{describirHorario(sug.fecha, sug.hora)}</strong>.</span>
            <button type="button" className="pt-sugerido-btn" onClick={() => { onDiaVisto(sug.fecha); onHorario(sug); }}>Me sirve</button>
          </div>
        )}
        <p className="pt-sub">{horario ? <>Elegiste el <strong>{describirHorario(horario.fecha, horario.hora)}</strong>. Queda confirmado cuando Pau te responda.</> : 'O elegí otro día y horario:'}</p>
        <div role="group" aria-label="Días con horarios libres" className="pt-dias-scroll">
          {dias.map(({ fecha, horas }) => {
            const d = parseFecha(fecha);
            const on = fecha === dia.fecha;
            return (
              <button key={fecha} type="button" className="pt-dia-chip" aria-pressed={on} onClick={() => onDiaVisto(fecha)}>
                <span className="pt-dia-sem">{CAL_DAYS[d.getDay()]}</span>
                <span className="pt-dia-num">{d.getDate()}</span>
                <span className="pt-dia-cant">{horas.length} libre{horas.length !== 1 ? 's' : ''}</span>
              </button>
            );
          })}
        </div>
        <div role="group" aria-label={`Horarios del ${DIAS_ES[parseFecha(dia.fecha).getDay()].toLowerCase()} ${parseFecha(dia.fecha).getDate()}`} className="pt-chips">
          {dia.horas.map(h => {
            const on = horario?.fecha === dia.fecha && horario?.hora === h;
            return (
              <button key={h} type="button" className={`pt-chip pt-hora${esSug(dia.fecha, h) && !horario ? ' pt-chip-sug' : ''}`} aria-pressed={on}
                onClick={() => onHorario(on ? null : { fecha: dia.fecha, hora: h })}>{h}</button>
            );
          })}
        </div>
        <p className="pt-sub" style={{fontSize:13}}>Los horarios libres pueden no estar actualizados: Pau te confirma si sigue disponible.</p>
        <button type="button" className="pt-link" onClick={() => { onHorario(null); onAMano(true); }}>
          Ninguno me sirve, prefiero escribir cuándo puedo
        </button>
      </>
    );
  }

  return (
    <>
      <p className="pt-sub">{hayHorarios ? 'Contale a Pau qué días y horarios te quedan cómodos.' : 'Pau todavía no publicó los horarios de esta semana. Contale qué días y horarios te quedan cómodos y te responde por WhatsApp con los turnos disponibles.'}</p>
      <Chips opciones={FRANJAS} value={franja} onChange={onFranja} label="Franja horaria" />
      <input id="pt-pref" className="pt-input" value={preferencia} onChange={e => onPreferencia(e.target.value)}
        aria-label="Días que te quedan bien" placeholder="Ej.: martes o jueves, después de las 15" />
      {hayHorarios && (
        <button type="button" className="pt-link" onClick={() => onAMano(false)}>Volver a los horarios libres</button>
      )}
    </>
  );
}
