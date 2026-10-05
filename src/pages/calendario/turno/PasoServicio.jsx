import { useState } from 'react';
import { inputStyle } from '../../../lib/styles';
import { chip, etiquetaPaso, paso } from './estilos';

// 2 · Servicio: chips con los servicios más usados (y el elegido, si no está) + "Otro…" para escribirlo.
export default function PasoServicio({ servicios, valor, onElegir }) {
  const lista = valor && !servicios.includes(valor) ? [valor, ...servicios] : servicios;
  const [otro, setOtro] = useState(false);
  return (
    <div role="group" aria-labelledby="turno-servicio" style={paso}>
      <span id="turno-servicio" style={etiquetaPaso}>2 · Servicio</span>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {lista.map(s => (
          <button key={s} type="button" aria-pressed={!otro && valor === s} onClick={() => { setOtro(false); onElegir(s); }} style={chip(!otro && valor === s)}>{s}</button>
        ))}
        <button type="button" aria-pressed={otro} onClick={() => { setOtro(true); onElegir(''); }} style={chip(otro)}>Otro…</button>
      </div>
      {otro && (
        <input autoFocus value={valor} onChange={e => onElegir(e.target.value)} placeholder="Qué se le hace" aria-label="Otro servicio" style={{...inputStyle,height:46}} />
      )}
    </div>
  );
}
