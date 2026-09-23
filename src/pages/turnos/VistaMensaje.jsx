import EstadoVacio from '../../components/ui/EstadoVacio';
import { WHATSAPP_PAU_VISIBLE } from '../../lib/constants';
import BotonEnviar from './BotonEnviar';

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

export default function VistaMensaje({ texto, faltan, enviado, onEnviado }) {
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
      {!listo && <p className="pt-falta pt-falta-lado">Falta completar: {faltan.join(', ')}.</p>}
      <BotonEnviar className="pt-enviar-lado" texto={texto} listo={listo} onEnviado={onEnviado} />
      {enviado && listo && (
        <EstadoVacio ilustracion="enviado" titulo="¡Listo! Se abrió WhatsApp"
          texto="Tocá enviar en el chat y Pau te responde para confirmar. Si no se abrió, tocá de nuevo el botón verde." tamanio={130} />
      )}
      <p className="pt-pie">
        Se abre WhatsApp con el mensaje listo para Pau (<span className="pt-num">{WHATSAPP_PAU_VISIBLE}</span>).
        Sólo tenés que tocar "enviar". Ella te responde para confirmar.
      </p>
    </aside>
  );
}
