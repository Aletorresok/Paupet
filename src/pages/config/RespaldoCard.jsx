import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import { C, cardStyle, serif } from '../../lib/styles';
import { descargarRespaldo, respaldoVencido, ultimoRespaldo } from '../../lib/respaldo';

const NOMBRES = { clientes:'clientes', visitas:'visitas', turnos:'turnos', notas:'notas y gastos', config:'configuración', fotos_cliente:'fotos' };

// Copia de seguridad: descarga todos los datos en un archivo para guardarlo.
export default function RespaldoCard({ toast }) {
  const [descargando, setDescargando] = useState(false);
  const [ultimo, setUltimo] = useState(ultimoRespaldo);
  const [resumen, setResumen] = useState(null);
  const vencido = respaldoVencido();

  const descargar = async () => {
    setDescargando(true);
    try {
      const cant = await descargarRespaldo();
      setResumen(cant);
      setUltimo(ultimoRespaldo());
      toast('Copia descargada. Guardala en un lugar seguro (Drive, mail, pendrive).');
    } catch (e) { toast('No se pudo descargar la copia: ' + e.message, true); }
    setDescargando(false);
  };

  return (
    <section aria-label="Copia de seguridad" style={{...cardStyle,padding:'18px 20px',marginBottom:16,display:'flex',flexDirection:'column',gap:10,borderColor:vencido?'#EBC98E':C.linea}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:220}}>
          <h3 style={{margin:0,fontFamily:serif,fontSize:19,fontWeight:600}}>Copia de seguridad</h3>
          <p style={{margin:'4px 0 0',fontSize:14,color:C.tintaSuave}}>
            Descarga en un archivo todos los clientes, visitas, turnos, gastos y la configuración.
            Conviene hacerlo una vez por semana y guardarlo en Drive o mandártelo por mail.
          </p>
        </div>
        <Btn onClick={descargar} disabled={descargando}><Icon name="download"/>{descargando ? 'Descargando…' : 'Descargar copia'}</Btn>
      </div>
      <p style={{margin:0,fontSize:13,color:vencido?C.ambar:C.verde,fontWeight:500}}>
        {ultimo ? `Última copia desde este dispositivo: ${ultimo.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}` : 'Todavía no se descargó ninguna copia desde este dispositivo.'}
      </p>
      {resumen && (
        <p style={{margin:0,fontSize:13,color:C.tintaSuave}}>
          Incluye: {Object.entries(resumen).map(([t, n]) => `${n} ${NOMBRES[t] || t}`).join(' · ')}
        </p>
      )}
    </section>
  );
}
