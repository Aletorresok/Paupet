import { CAL_DAYS, DIAS_ES } from '../../lib/constants';
import { parseFecha } from '../../lib/utils';
import Chips from './Chips';
import { FRANJAS } from './opciones';

// Paso "¿Cuándo te queda bien?": horarios libres de Pau o, si no hay (o ninguno sirve), texto libre.
export default function ElegirHorario({ dias, cargando, aMano, onAMano, horario, onHorario, franja, onFranja, preferencia, onPreferencia }) {
  if (cargando) return <p className="pt-sub">Buscando horarios libres…</p>;

  const hayHorarios = dias.length > 0;
  if (hayHorarios && !aMano) {
    return (
      <>
        <p className="pt-sub">Horarios libres de los próximos días. Elegí uno y Pau te confirma.</p>
        <div className="pt-dias">
          {dias.map(({ fecha, horas }) => {
            const d = parseFecha(fecha);
            return (
              <div key={fecha} className="pt-dia">
                <div className="pt-dia-nom">{CAL_DAYS[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}<small>{DIAS_ES[d.getDay()].toLowerCase()}</small></div>
                <div role="group" aria-label={`${DIAS_ES[d.getDay()]} ${d.getDate()}`} className="pt-chips">
                  {horas.map(h => {
                    const on = horario?.fecha === fecha && horario?.hora === h;
                    return (
                      <button key={h} type="button" className="pt-chip pt-hora" aria-pressed={on}
                        onClick={() => onHorario(on ? null : { fecha, hora: h })}>{h}</button>
                    );
                  })}
                </div>
              </div>
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
