import { aHora } from '../../../lib/duracion';
import { C } from '../../../lib/styles';
import { toISODate, todayStr } from '../../../lib/utils';
import { layoutDia, rangoHoras } from './agendaUtils';
import TurnoBloque from './TurnoBloque';

const PX_MIN = 1;          // 1 px por minuto → 60 px por hora
const CABECERA = 52;
const NOMBRES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Grilla semanal: una columna por día, turnos ubicados por hora y duración.
// Tocar un lugar vacío crea un turno a esa hora (redondeada a la media hora).
export default function AgendaSemana({ dias, turnos, clientes, seleccionado, onSelectTurno, onSelectDia, onNuevo }) {
  const deLaSemana = turnos.filter(t => dias.some(d => toISODate(d) === t.fecha));
  const { desde, hasta } = rangoHoras(deLaSemana);
  const horas = [];
  for (let m = desde; m < hasta; m += 60) horas.push(m);
  const altoGrilla = (hasta - desde) * PX_MIN;
  const hoy = todayStr();

  const clickVacio = (fecha, e) => {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const min = desde + Math.floor(y / PX_MIN / 30) * 30;
    onNuevo(fecha, aHora(min));
  };

  return (
    <div style={{display:'flex',background:'white',border:`1px solid ${C.linea}`,borderRadius:16,overflow:'hidden'}}>
      <div style={{width:52,flexShrink:0,borderRight:'1px solid #F0EBE4',paddingTop:CABECERA}}>
        {horas.map(m => (
          <div key={m} style={{height:60*PX_MIN,fontSize:12,color:C.tintaSuave,textAlign:'right',paddingRight:8,transform:'translateY(-7px)'}}>{aHora(m)}</div>
        ))}
      </div>
      {dias.map(d => {
        const iso = toISODate(d);
        const esHoy = iso === hoy;
        const { items } = layoutDia(deLaSemana.filter(t => t.fecha === iso));
        return (
          <div key={iso} style={{flex:'1 1 0',minWidth:0,borderRight:'1px solid #F0EBE4'}}>
            <button type="button" onClick={() => onSelectDia(iso)} style={{
              width:'100%',height:CABECERA,border:'none',borderBottom:'1px solid #F0EBE4',cursor:'pointer',fontFamily:'inherit',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              background:esHoy?C.mentaSuave:'white',color:esHoy?C.verde:C.tinta,
            }}>
              <span style={{fontSize:12,textTransform:'uppercase',letterSpacing:'.06em',color:esHoy?C.verde:C.tintaSuave}}>{NOMBRES[d.getDay()]}</span>
              <span style={{fontSize:17,fontWeight:600}}>{d.getDate()}</span>
            </button>
            <div onClick={e => clickVacio(iso, e)} title="Tocá para agregar un turno" style={{
              position:'relative',height:altoGrilla,cursor:'copy',
              backgroundImage:`repeating-linear-gradient(to bottom, transparent 0, transparent ${60*PX_MIN-1}px, #F3EFE9 ${60*PX_MIN-1}px, #F3EFE9 ${60*PX_MIN}px)`,
            }}>
              {items.map(it => (
                <TurnoBloque key={it.turno.id} item={it} desde={desde} pxMin={PX_MIN}
                  cliente={clientes.find(c => c.id === it.turno.clientId) || {}}
                  seleccionado={seleccionado === it.turno.id}
                  onClick={onSelectTurno} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
