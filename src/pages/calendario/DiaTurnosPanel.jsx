import { useResp } from '../../context/resp';
import { cardStyle, sectionTitleStyle } from '../../lib/styles';
import { fmtFecha } from '../../lib/utils';
import TurnoCard from './TurnoCard';
import EstadoVacio from '../../components/ui/EstadoVacio';

export default function DiaTurnosPanel({ selectedDay, turnos, clientes, ...actions }) {
  const { isMob } = useResp();
  const empty = { fontSize:13, color:'#5B6661' };
  return (
    <div style={{width:isMob?'100%':'300px',flexShrink:0,...cardStyle,padding:'18px 16px'}}>
      <div style={sectionTitleStyle}>
        {selectedDay ? fmtFecha(selectedDay) : 'Seleccioná un día'}
      </div>
      {!selectedDay ? <p style={empty}>Hacé click en un día del calendario</p>
        : !turnos.length ? <EstadoVacio ilustracion="durmiendo" texto="Sin turnos para este día" tamanio={120} />
        : turnos.map(t => (
          <TurnoCard key={t.id} turno={t} cliente={clientes.find(x=>x.id===t.clientId)||{}} {...actions} />
        ))
      }
    </div>
  );
}
