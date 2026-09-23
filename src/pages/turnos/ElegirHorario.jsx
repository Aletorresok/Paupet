import { CAL_DAYS, DIAS_ES } from '../../lib/constants';
import { parseFecha } from '../../lib/utils';
import Chips from './Chips';
import { FRANJAS } from './opciones';

// Paso "¿Cuándo te queda bien?": horarios libres de Pau o, si no hay (o ninguno sirve), texto libre.
export default function ElegirHorario({ dias, cargando, aMano, onAMano, horario, onHorario, diaVisto, onDiaVisto, franja, onFranja, preferencia, onPreferencia }) {
  if (cargando) return <p className="pt-sub">Buscando horarios libres…</p>;

  const hayHorarios = dias.length > 0;
  if (hayHorarios && !aMano) {
    // Día que se muestra: el del horario elegido, el que tocó la persona, o el primero.
    const fechaVista = diaVisto && dias.some(d => d.fecha === diaVisto) ? diaVisto : horario?.fecha || dias[0].fecha;
    const dia = dias.find(d => d.fecha === fechaVista) || dias[0];
    return (
      <>
        <p className="pt-sub">Elegí un día y un horario libre. Pau te confirma.</p>
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
              <button key={h} type="button" className="pt-chip pt-hora" aria-pressed={on}
                onClick={() => onHorario(on ? null : { fecha: dia.fecha, hora: h })}>{h}</button>
            );
          })}
        </div>
        <button type="button" className="pt-link" onClick={() => { onHorario(null); onAMano(true); }}>
          Ninguno me sirve, prefiero escribir cuándo puedo
        </button>
      </>
    );
  }

  return (
    <>
      <p className="pt-sub">Contale a Pau qué días y horarios te quedan cómodos.</p>
      <Chips opciones={FRANJAS} value={franja} onChange={onFranja} label="Franja horaria" />
      <input id="pt-pref" className="pt-input" value={preferencia} onChange={e => onPreferencia(e.target.value)}
        aria-label="Días que te quedan bien" placeholder="Ej.: martes o jueves, después de las 15" />
      {hayHorarios && (
        <button type="button" className="pt-link" onClick={() => onAMano(false)}>Volver a los horarios libres</button>
      )}
    </>
  );
}
