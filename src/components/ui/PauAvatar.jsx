// Foto de Pau (redonda). Con `onClick` es un botón (en Hoy, abre Ajustes).
export default function PauAvatar({ size = 44, onClick, label = 'Ajustes' }) {
  const img = <img src="/pau-avatar.png" alt="" width={size} height={size} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',display:'block',background:'#E4F4EC'}} />;
  if (!onClick) return img;
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} style={{padding:0,border:'none',background:'none',borderRadius:'50%',cursor:'pointer',minWidth:44,minHeight:44,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {img}
    </button>
  );
}
