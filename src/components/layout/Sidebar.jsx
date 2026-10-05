import { NAV_EXTRA, NAV_ITEMS, NAV_PADRE } from '../../lib/constants';
import { respaldoVencido } from '../../lib/respaldo';
import { C } from '../../lib/styles';
import pauSecador from '../../assets/ilustraciones/pau-secador.webp';
import SidebarBrand from './SidebarBrand';
import SidebarNavItem from './SidebarNavItem';

// Menú lateral (sólo escritorio y tablet; en el celular se usa MobileNav).
export default function Sidebar({ activePage, onNav, avisosCount = 0, onLogout }) {
  const marcada = NAV_EXTRA.some(i => i.page === activePage) ? activePage : NAV_PADRE[activePage] || activePage;
  const item = i => (
    <SidebarNavItem
      key={i.page}
      icon={i.icon}
      label={i.label}
      active={marcada===i.page}
      badgeCount={i.badge ? avisosCount : 0}
      punto={i.page === 'config' && respaldoVencido() ? 'Falta hacer la copia de seguridad' : null}
      onClick={() => onNav(i.page)}
    />
  );

  return (
    <nav aria-label="Principal" style={{
      width:248,minWidth:248,height:'100%',boxSizing:'border-box',background:'white',
      borderRight:`1px solid ${C.linea}`,display:'flex',flexDirection:'column',padding:'24px 16px',gap:2,overflowY:'auto',
    }}>
      <div style={{marginBottom:20}}><SidebarBrand /></div>
      {NAV_ITEMS.map(item)}
      <div style={{flex:1,minHeight:20}}/>
      <img src={pauSecador} alt="Pau secando al salchicha" style={{width:'100%',maxWidth:200,height:'auto',alignSelf:'center',margin:'8px 0 12px'}} />
      {NAV_EXTRA.map(item)}
      <SidebarNavItem icon="logout" label="Salir" onClick={onLogout} />
    </nav>
  );
}
