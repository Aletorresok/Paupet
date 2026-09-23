import Icon from '../../components/ui/Icon';
import { linkWhatsApp } from './mensajeTurno';

// Botón que abre WhatsApp con el mensaje. Deshabilitado mientras falten datos.
export default function BotonEnviar({ texto, listo, onEnviado, className = '' }) {
  return (
    <a className={`pt-enviar ${className}`} href={listo ? linkWhatsApp(texto) : undefined} target="_blank" rel="noopener noreferrer"
      aria-disabled={!listo} onClick={e => { if (!listo) e.preventDefault(); else onEnviado(); }}>
      <Icon name="chat" size={22} strokeWidth={1.9} />
      Enviar por WhatsApp
    </a>
  );
}
