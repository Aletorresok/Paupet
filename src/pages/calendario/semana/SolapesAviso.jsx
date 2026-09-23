import Icon from '../../../components/ui/Icon';
import { C } from '../../../lib/styles';
import { fmtFecha } from '../../../lib/utils';

// Aviso cuando dos turnos de la semana se pisan.
export default function SolapesAviso({ solapes }) {
  if (!solapes.length) return null;
  return (
    <div role="alert" style={{display:'flex',alignItems:'flex-start',gap:10,background:C.rosaSuave,border:'1px solid #F1C3D0',borderRadius:12,padding:'10px 14px',color:'#8E2A48',fontSize:14,marginBottom:14}}>
      <Icon name="alert" size={20} />
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        <strong>{solapes.length === 1 ? 'Hay dos turnos que se superponen' : `Hay ${solapes.length} superposiciones esta semana`}</strong>
        {solapes.slice(0, 3).map(([a, b]) => (
          <span key={`${a.id}-${b.id}`}>{fmtFecha(a.fecha)}: {a.dogName} ({a.hora}) y {b.dogName} ({b.hora})</span>
        ))}
      </div>
    </div>
  );
}
