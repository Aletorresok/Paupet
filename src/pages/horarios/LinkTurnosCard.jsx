import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import { RUTA_TURNOS } from '../../lib/constants';
import { C, cardStyle } from '../../lib/styles';

// Link de la página pública "Pedí tu turno", para la bio de Instagram o las historias.
export default function LinkTurnosCard() {
  const link = window.location.origin + RUTA_TURNOS;
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copiá el link:', link);
    }
  };

  return (
    <div style={{...cardStyle,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',background:C.mentaSuave,borderColor:C.mentaBorde}}>
      <div style={{flex:'1 1 260px',minWidth:0}}>
        <div style={{fontWeight:600,fontSize:15,color:C.verde}}>Link para pedir turno</div>
        <div style={{fontSize:13,color:C.tinta,marginTop:2,lineHeight:1.45}}>
          Los horarios que <b>guardes</b> acá aparecen como libres, menos los tomados y los que ya tienen turno en la agenda. Los días que no cargues acá usan los horarios base de Configuración.
        </div>
        <div style={{fontSize:14,marginTop:6,fontWeight:500,overflowWrap:'anywhere',userSelect:'all'}}>{link}</div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <Btn size="sm" variant="ghost" onClick={() => window.open(RUTA_TURNOS, '_blank', 'noopener')}>Ver página</Btn>
        <Btn size="sm" onClick={copiar}>
          {copiado && <Icon name="check" size={16} />}
          {copiado ? 'Copiado' : 'Copiar link'}
        </Btn>
      </div>
    </div>
  );
}
