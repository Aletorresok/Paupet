import { useState } from 'react';
import Icon from '../../components/ui/Icon';
import { C } from '../../lib/styles';
import { DIAS_RECORDATORIO, respaldoVencido, ultimoRespaldo } from '../../lib/respaldo';

// Aviso suave si hace más de una semana que no se descarga una copia desde este dispositivo.
const KEY_OCULTO = 'paupet_respaldo_oculto_hasta';
const hoyKey = () => new Date().toDateString();
const leerOculto = () => { try { return localStorage.getItem(KEY_OCULTO) === hoyKey(); } catch { return false; } };

export default function RecordatorioRespaldo({ onIr }) {
  const [oculto, setOculto] = useState(leerOculto);
  if (oculto || !respaldoVencido()) return null;
  const u = ultimoRespaldo();
  const ocultar = () => { setOculto(true); try { localStorage.setItem(KEY_OCULTO, hoyKey()); } catch { /* nada */ } };
  return (
    <div role="status" style={{display:'flex',alignItems:'center',gap:8,background:C.ambarSuave,color:'#5E3900',borderRadius:10,padding:'4px 4px 4px 12px',fontSize:13,marginBottom:14}}>
      <Icon name="download" size={16}/>
      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={u ? `Hace más de ${DIAS_RECORDATORIO} días que no descargás una copia de seguridad.` : 'Todavía no descargaste ninguna copia de seguridad.'}>
        {u ? `Copia de seguridad: hace +${DIAS_RECORDATORIO} días` : 'Todavía sin copia de seguridad'}
      </span>
      <button type="button" onClick={onIr} style={{border:'none',background:'white',color:'#5E3900',borderRadius:8,height:32,padding:'0 12px',fontFamily:'inherit',fontWeight:600,fontSize:13,cursor:'pointer',flexShrink:0}}>Hacer copia</button>
      <button type="button" onClick={ocultar} aria-label="Ocultar aviso" style={{border:'none',background:'transparent',color:'#5E3900',cursor:'pointer',display:'flex',padding:6}}><Icon name="x" size={16}/></button>
    </div>
  );
}
