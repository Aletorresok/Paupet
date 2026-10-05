import { NAV_ITEMS, NAV_PADRE } from '../../lib/constants';
import { C } from '../../lib/styles';
import Icon from '../ui/Icon';

const tabStyle = active => ({
  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
  fontSize:12,fontWeight:active?600:400,color:active?C.verde:'#46524D',
  background:'none',border:'none',fontFamily:'inherit',cursor:'pointer',minHeight:52,position:'relative',
});

// El botón flotante "Nuevo turno" sólo va donde se dan turnos.
const CON_BOTON = ['dashboard', 'calendario'];

// Barra inferior del celular: Hoy / Agenda / Perros / Avisos / Finanzas, y botón flotante "Nuevo turno".
export default function MobileNav({ activePage, onNav, avisosCount = 0, onNuevoTurno }) {
  const marcada = NAV_PADRE[activePage] || activePage;

  return (
    <>
      {CON_BOTON.includes(activePage) && (
        <button type="button" onClick={onNuevoTurno} aria-label="Nuevo turno" style={{
          position:'fixed',right:16,bottom:92,zIndex:50,width:60,height:60,borderRadius:18,border:'none',
          background:C.menta,color:C.sobreMenta,display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 8px 20px rgba(19,48,42,.28), 0 2px 6px rgba(19,48,42,.18)',cursor:'pointer',
        }}>
          <Icon name="plus" size={26} strokeWidth={2} />
        </button>
      )}

      <nav aria-label="Principal" style={{
        position:'fixed',left:0,right:0,bottom:0,zIndex:61,height:76,boxSizing:'border-box',padding:'6px 4px 14px',
        background:'white',borderTop:`1px solid ${C.linea}`,display:'grid',gridTemplateColumns:`repeat(${NAV_ITEMS.length},minmax(0,1fr))`,
      }}>
        {NAV_ITEMS.map(i => (
          <button key={i.page} type="button" onClick={() => onNav(i.page)} aria-current={marcada===i.page?'page':undefined} style={tabStyle(marcada===i.page)}>
            <Icon name={i.icon} size={22} />
            {i.label}
            {i.badge && avisosCount > 0 && (
              <span aria-label={`${avisosCount} para mandar`} style={{position:'absolute',top:2,left:'calc(50% + 6px)',background:C.rosa,color:'white',fontSize:10,fontWeight:700,borderRadius:999,padding:'1px 6px'}}>{avisosCount}</span>
            )}
          </button>
        ))}
      </nav>
    </>
  );
}
