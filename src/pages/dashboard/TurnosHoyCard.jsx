import { cardStyle, sectionTitleStyle } from '../../lib/styles';
import TurnoHoyItem from './TurnoHoyItem';

export default function TurnosHoyCard({ turnos, clientes, onCompletar, onNoVino, onEditTurno }) {
  return (
    <div style={{...cardStyle,padding:'18px 20px'}}>
      <div style={sectionTitleStyle}>Turnos de hoy</div>
      {!turnos.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Sin turnos para hoy</p>
        : turnos.map(t => (
          <TurnoHoyItem
            key={t.id}
            turno={t}
            cliente={clientes.find(x => x.id===t.clientId)||{}}
            onCompletar={onCompletar}
            onNoVino={onNoVino}
            onEditTurno={onEditTurno}
          />
        ))
      }
    </div>
  );
}
