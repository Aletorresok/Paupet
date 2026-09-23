import Icon from '../../components/ui/Icon';
import { WHATSAPP_PAU_VISIBLE } from '../../lib/constants';
import { linkWhatsApp } from './mensajeTurno';

// Cómo le llega el mensaje a Pau, en *negrita* estilo WhatsApp.
function Burbuja({ texto }) {
  return (
    <div className="pt-burbuja" aria-live="polite">
      {texto.split('\n').map((linea, i) => (
        <div key={i}>
          {linea === '' ? ' ' : linea.split(/(\*[^*]+\*)/).map((p, j) =>
            p.startsWith('*') && p.endsWith('*') && p.length > 2 ? <b key={j}>{p.slice(1, -1)}</b> : p)}
        </div>
      ))}
    </div>
  );
}

export default function VistaMensaje({ texto, faltan }) {
  const listo = faltan.length === 0;
  return (
    <aside className="pt-lado" aria-labelledby="pt-t-msj">
      <span className="pt-eyebrow" id="pt-t-msj">El mensaje que le llega a Pau</span>
      <div className="pt-chat">
        <div className="pt-para">
          <img className="pt-avatar pt-avatar-chico" src="/pau-avatar.png" alt="" />
          <div>Pau 💙<small>Paupet peluquería canina</small></div>
        </div>
        <Burbuja texto={texto} />
      </div>
      {!listo && <p className="pt-falta">Falta completar: {faltan.join(', ')}.</p>}
      <a className="pt-enviar" href={listo ? linkWhatsApp(texto) : undefined} target="_blank" rel="noopener noreferrer"
        aria-disabled={!listo} onClick={e => { if (!listo) e.preventDefault(); }}>
        <Icon name="chat" size={22} strokeWidth={1.9} />
        Enviar por WhatsApp
      </a>
      <p className="pt-pie">
        Se abre WhatsApp con el mensaje listo para Pau (<span className="pt-num">{WHATSAPP_PAU_VISIBLE}</span>).
        Sólo tenés que tocar "enviar". Ella te responde para confirmar.
      </p>
    </aside>
  );
}
