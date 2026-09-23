import Icon from '../../components/ui/Icon';

// Grupo de botones "chip". `multiple` permite elegir varios (value es un array);
// si no, value es un texto y tocar el elegido lo deja como está.
// `iconos` (opcional): { opción: nombre de ícono } se muestra cuando no está elegida.
export default function Chips({ opciones, value, onChange, multiple = false, label, iconos = {}, className = '' }) {
  const elegido = op => multiple ? value.includes(op) : value === op;
  const tocar = op => {
    if (!multiple) return onChange(op);
    onChange(elegido(op) ? value.filter(v => v !== op) : [...value, op]);
  };
  return (
    <div role="group" aria-label={label} className={`pt-chips ${className}`}>
      {opciones.map(op => (
        <button key={op} type="button" className="pt-chip" aria-pressed={elegido(op)} onClick={() => tocar(op)}>
          {elegido(op) ? <Icon name="check" size={15} strokeWidth={2.6} /> : iconos[op] && <Icon name={iconos[op]} size={18} />}
          {op}
        </button>
      ))}
    </div>
  );
}
