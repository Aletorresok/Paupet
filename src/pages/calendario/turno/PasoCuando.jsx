import { useState } from 'react';
import { inputStyle } from '../../../lib/styles';
import { etiquetaDia } from '../ayudaTurno';
import { chip, etiquetaPaso, nota, paso } from './estilos';

// 3 · Cuándo: chips de los días con horarios libres y, abajo, los horarios libres de ese día (regla única,
// `libresPorDia`). "Otro día" / "Otra hora" abren un campo. Si no hay horarios cargados, fecha y hora a mano.
export default function PasoCuando({ dias, fecha, hora, onFecha, onHora, notaDuracion }) {
  const [otroDia, setOtroDia] = useState(false);
  const [otraHora, setOtraHora] = useState(false);
  const campos = (
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
      <input type="date" value={fecha} onChange={e => onFecha(e.target.value)} aria-label="Fecha" style={inputStyle} />
      <input type="time" value={hora} onChange={e => onHora(e.target.value)} aria-label="Hora" style={inputStyle} />
    </div>
  );

  if (!dias.length) {
    return (
      <div role="group" aria-labelledby="turno-cuando" style={paso}>
        <span id="turno-cuando" style={etiquetaPaso}>3 · Cuándo</span>
        {campos}
        <span style={nota}>No hay horarios cargados en Horarios para Stories. {notaDuracion}</span>
      </div>
    );
  }

  // El día y la hora elegidos siempre aparecen como chip, aunque no estén libres (p. ej. desde la agenda).
  const listaDias = dias.some(d => d.fecha === fecha) || !fecha ? dias : [...dias, { fecha, horas: [] }].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const libres = dias.find(d => d.fecha === fecha)?.horas || [];
  const horas = hora && !libres.includes(hora) ? [...libres, hora].sort() : libres;
  const elegirDia = f => { setOtroDia(false); onFecha(f); };

  return (
    <div role="group" aria-labelledby="turno-cuando" style={paso}>
      <span id="turno-cuando" style={etiquetaPaso}>3 · Cuándo</span>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none'}}>
        {listaDias.map(d => (
          <button key={d.fecha} type="button" aria-pressed={!otroDia && d.fecha === fecha} onClick={() => elegirDia(d.fecha)} style={chip(!otroDia && d.fecha === fecha)}>
            {etiquetaDia(d.fecha)}
          </button>
        ))}
        <button type="button" aria-pressed={otroDia} onClick={() => setOtroDia(true)} style={chip(otroDia)}>Otro día</button>
      </div>
      {otroDia && <input type="date" value={fecha} onChange={e => onFecha(e.target.value)} aria-label="Fecha" style={inputStyle} />}

      {horas.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8}}>
          {horas.map(h => (
            <button key={h} type="button" aria-pressed={!otraHora && h === hora} onClick={() => { setOtraHora(false); onHora(h); }}
              style={{...chip(!otraHora && h === hora),padding:0}}>{h}</button>
          ))}
          <button type="button" aria-pressed={otraHora} onClick={() => setOtraHora(true)} style={{...chip(otraHora),padding:0,fontSize:14}}>Otra hora</button>
        </div>
      )}
      {(otraHora || !horas.length) && <input type="time" value={hora} onChange={e => onHora(e.target.value)} aria-label="Hora" style={inputStyle} />}
      <span style={nota}>{horas.length ? 'Sólo horarios libres. ' : 'Ese día no quedan horarios libres: poné la hora. '}{notaDuracion}</span>
    </div>
  );
}
