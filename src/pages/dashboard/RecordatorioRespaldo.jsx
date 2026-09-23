import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';
import { DIAS_RECORDATORIO, respaldoVencido, ultimoRespaldo } from '../../lib/respaldo';

// Aviso suave si hace más de una semana que no se descarga una copia desde este dispositivo.
export default function RecordatorioRespaldo({ onIr }) {
  const [oculto, setOculto] = useState(false);
  if (oculto || !respaldoVencido()) return null;
  const u = ultimoRespaldo();
  return (
    <div role="status" style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',background:C.ambarSuave,color:'#5E3900',borderRadius:12,padding:'10px 14px',fontSize:14,marginBottom:16}}>
      <Icon name="download"/>
      <span style={{flex:1,minWidth:200}}>
        {u ? `Hace más de ${DIAS_RECORDATORIO} días que no descargás una copia de seguridad.` : 'Todavía no descargaste ninguna copia de seguridad de los datos.'}
      </span>
      <button type="button" onClick={onIr} style={{border:'none',background:'white',color:'#5E3900',borderRadius:10,height:36,padding:'0 14px',fontFamily:'inherit',fontWeight:600,fontSize:14,cursor:'pointer'}}>Hacer copia</button>
      <button type="button" onClick={() => setOculto(true)} aria-label="Ocultar aviso" style={{border:'none',background:'transparent',color:'#5E3900',cursor:'pointer',display:'flex',padding:6}}><Icon name="x" size={16}/></button>
    </div>
  );
}
