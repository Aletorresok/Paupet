import Icon from '../../components/ui/Icon';
import { linkWhatsApp } from './mensajeTurno';

// Botón que abre WhatsApp con el mensaje. Si faltan datos, en vez de abrir WhatsApp lleva al primer campo que falta.
export default function BotonEnviar({ texto, listo, onEnviado, onFaltante, className = '' }) {
  return (
    <a role="button" className={`pt-enviar ${className}`} href={listo ? linkWhatsApp(texto) : undefined} target="_blank" rel="noopener noreferrer"
      aria-disabled={!listo} onClick={e => { if (!listo) { e.preventDefault(); onFaltante?.(); } else onEnviado(); }}>
      <Icon name="chat" size={22} strokeWidth={1.9} />
      Enviar por WhatsApp
    </a>
  );
}
