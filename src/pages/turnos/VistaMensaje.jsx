import EstadoVacio from '../../components/ui/EstadoVacio';
import { WHATSAPP_PAU_VISIBLE } from '../../lib/constants';
import BotonEnviar from './BotonEnviar';

// Columna del envío: en compu va a la derecha; en el celular el botón va fijo abajo
// (ver .pt-barra) y acá sólo queda la confirmación y la aclaración.
// Sin vista previa del mensaje: en el uso real no aportaba.
export default function VistaMensaje({ texto, faltan, enviado, onEnviado, onFaltante }) {
  const listo = faltan.length === 0;
  return (
    <aside className="pt-lado" aria-label="Enviar pedido">
      {!listo && <p className="pt-falta pt-falta-lado">Falta completar: {faltan.join(', ')}.</p>}
      <BotonEnviar className="pt-enviar-lado" texto={texto} listo={listo} onEnviado={onEnviado} onFaltante={onFaltante} />
      {enviado && listo && (
        <EstadoVacio ilustracion="enviado" titulo="¡Listo! Se abrió WhatsApp"
          texto="Tocá enviar en el chat. Todavía no es un turno confirmado: Pau te responde por WhatsApp. Si no se abrió, tocá de nuevo el botón verde." tamanio={130} />
      )}
      <p className="pt-pie">
        Se abre WhatsApp con tu pedido listo para Pau (<span className="pt-num">{WHATSAPP_PAU_VISIBLE}</span>).
        Sólo tenés que tocar "enviar".
      </p>
      <p className="pt-aviso">
        <strong>El turno no está confirmado</strong> hasta que Pau te responda por WhatsApp.
        Los horarios libres pueden no estar actualizados.
      </p>
    </aside>
  );
}
