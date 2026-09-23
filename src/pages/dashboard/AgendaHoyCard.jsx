import Badge from '../../components/ui/Badge';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import EstadoVacio from '../../components/ui/EstadoVacio';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';

const ESTADO = {
  confirmed: { label:'Confirmado', badge:'green',  barra:C.menta },
  pending:   { label:'Pendiente',  badge:'orange', barra:'#C98A1B' },
  completed: { label:'Completado', badge:'gray',   barra:'#B9C2BE' },
};

// Lista de todos los turnos de hoy, en orden de hora.
export default function AgendaHoyCard({ turnos, clientes, onCompletar, onEditTurno, onVerAgenda }) {
  const lista = [...turnos].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  return (
    <section aria-label="Agenda de hoy" style={{...cardStyle,padding:'18px 20px'}}>
      <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
        <h3 style={{...sectionTitleStyle,marginBottom:0,flex:1}}>Agenda de hoy</h3>
        <Btn size="sm" variant="ghost" onClick={onVerAgenda}>Ver agenda</Btn>
      </div>
      {!lista.length ? <EstadoVacio ilustracion="durmiendo" titulo="Hoy no hay turnos" texto="Buen momento para mirar quiénes ya deberían volver." tamanio={150} />
        : lista.map(t => {
          const c = clientes.find(x => x.id === t.clientId) || {};
          const e = ESTADO[t.estado] || ESTADO.pending;
          const hecho = t.estado === 'completed';
          return (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderTop:'1px solid #F0EBE4',opacity:hecho?.75:1}}>
              <span style={{width:48,fontSize:15,fontWeight:600,flexShrink:0}}>{t.hora || '–'}</span>
              <span style={{width:4,alignSelf:'stretch',borderRadius:4,background:e.barra,flexShrink:0}}/>
              <button type="button" onClick={()=>onEditTurno(t)} style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',background:'none',border:'none',textAlign:'left',fontFamily:'inherit',cursor:'pointer',color:C.tinta,padding:0}}>
                <span style={{fontSize:15,fontWeight:500}}>{t.dogName || c.dog} <span style={{color:C.tintaSuave,fontWeight:400}}>· {c.owner || ''}</span></span>
                <span style={{fontSize:13,color:C.tintaSuave}}>{t.servicio} · {fmtPeso(t.precio)}</span>
              </button>
              <Badge variant={e.badge}>{e.label}</Badge>
              {!hecho && <Btn size="xs" variant="ghost" onClick={()=>onCompletar(t.id)} aria-label="Completar y cobrar"><Icon name="check" size={16} strokeWidth={2}/></Btn>}
            </div>
          );
        })
      }
    </section>
  );
}
