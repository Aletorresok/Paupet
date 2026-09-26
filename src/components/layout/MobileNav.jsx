import { useState } from 'react';
import { NAV_ITEMS } from '../../lib/constants';
import { C } from '../../lib/styles';
import Icon from '../ui/Icon';

const tabStyle = active => ({
  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
  fontSize:12,fontWeight:active?600:400,color:active?C.verde:'#46524D',
  background:'none',border:'none',fontFamily:'inherit',cursor:'pointer',minHeight:52,position:'relative',
});

// Barra inferior del celular: Hoy / Agenda / Clientes / Más, y botón flotante "Nuevo turno".
export default function MobileNav({ activePage, onNav, pendingCount, pedidosCount = 0, onNuevoTurno, onLogout }) {
  const [masOpen, setMasOpen] = useState(false);
  const principales = NAV_ITEMS.filter(i => i.movil);
  const resto = NAV_ITEMS.filter(i => !i.movil);
  const enMas = resto.some(i => i.page === activePage);
  const ir = p => { setMasOpen(false); onNav(p); };

  return (
    <>
      <button type="button" onClick={onNuevoTurno} aria-label="Nuevo turno" style={{
        position:'fixed',right:16,bottom:92,zIndex:50,width:60,height:60,borderRadius:18,border:'none',
        background:C.menta,color:C.sobreMenta,display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 8px 20px rgba(19,48,42,.28), 0 2px 6px rgba(19,48,42,.18)',cursor:'pointer',
      }}>
        <Icon name="plus" size={26} strokeWidth={2} />
      </button>

      {masOpen && (
        <div onClick={() => setMasOpen(false)} style={{position:'fixed',inset:0,zIndex:60,background:'rgba(31,42,38,.4)'}}>
          <div onClick={e => e.stopPropagation()} style={{position:'absolute',left:0,right:0,bottom:76,background:'white',borderRadius:'20px 20px 0 0',padding:'10px 12px 12px',display:'flex',flexDirection:'column',gap:2}}>
            <span style={{alignSelf:'center',width:40,height:5,borderRadius:3,background:'#D5DBD8',marginBottom:6}}/>
            {resto.map(i => (
              <button key={i.page} type="button" onClick={() => ir(i.page)} style={{display:'flex',alignItems:'center',gap:12,height:52,padding:'0 12px',borderRadius:12,border:'none',background:activePage===i.page?C.mentaSuave:'transparent',color:C.tinta,fontFamily:'inherit',fontSize:16,textAlign:'left',cursor:'pointer'}}>
                <Icon name={i.icon} size={22} />{i.label}
              </button>
            ))}
            <button type="button" onClick={onLogout} style={{display:'flex',alignItems:'center',gap:12,height:52,padding:'0 12px',borderRadius:12,border:'none',background:'transparent',color:C.rosa,fontFamily:'inherit',fontSize:16,textAlign:'left',cursor:'pointer'}}>
              <Icon name="logout" size={22} />Salir
            </button>
          </div>
        </div>
      )}

      <nav aria-label="Principal" style={{
        position:'fixed',left:0,right:0,bottom:0,zIndex:61,height:76,boxSizing:'border-box',padding:'6px 8px 14px',
        background:'white',borderTop:`1px solid ${C.linea}`,display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',
      }}>
        {principales.map(i => (
          <button key={i.page} type="button" onClick={() => ir(i.page)} aria-current={activePage===i.page?'page':undefined} style={tabStyle(activePage===i.page)}>
            <Icon name={i.icon} size={22} />
            {i.label}
            {i.badge && pendingCount > 0 && (
              <span style={{position:'absolute',top:2,left:'calc(50% + 6px)',background:C.rosa,color:'white',fontSize:10,fontWeight:700,borderRadius:999,padding:'1px 6px'}}>{pendingCount}</span>
            )}
            {i.page === 'dashboard' && pedidosCount > 0 && (
              <span aria-label={`${pedidosCount} pedidos de turno`} style={{position:'absolute',top:2,left:'calc(50% + 6px)',background:C.verde,color:'white',fontSize:10,fontWeight:700,borderRadius:999,padding:'1px 6px'}}>{pedidosCount}</span>
            )}
          </button>
        ))}
        <button type="button" onClick={() => setMasOpen(o => !o)} aria-expanded={masOpen} style={tabStyle(enMas || masOpen)}>
          <Icon name="more" size={22} />Más
        </button>
      </nav>
    </>
  );
}
