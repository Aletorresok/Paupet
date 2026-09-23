import Btn from '../../components/ui/Btn';

export default function DisenoSelector({ value, onChange }) {
  return (
    <div role="group" aria-label="Diseño de la imagen" style={{display:'flex',gap:6,marginLeft:'auto'}}>
      <Btn size="sm" variant={value==='clasico'?'primary':'ghost'} onClick={()=>onChange('clasico')}>Clásico</Btn>
      <Btn size="sm" variant={value==='nuevo'?'primary':'ghost'} onClick={()=>onChange('nuevo')}>Nuevo ✨</Btn>
    </div>
  );
}
