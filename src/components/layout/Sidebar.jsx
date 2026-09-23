import { NAV_ITEMS } from '../../lib/constants';
import { C } from '../../lib/styles';
import SidebarBrand from './SidebarBrand';
import SidebarNavItem from './SidebarNavItem';

const GRUPOS = [{id:'dia',label:'Día a día'},{id:'negocio',label:'Negocio'}];

// Menú lateral (sólo escritorio y tablet; en el celular se usa MobileNav).
export default function Sidebar({ activePage, onNav, pendingCount, onLogout }) {
  return (
    <nav aria-label="Principal" style={{
      width:248,minWidth:248,height:'100%',boxSizing:'border-box',background:'white',
      borderRight:`1px solid ${C.linea}`,display:'flex',flexDirection:'column',padding:'24px 16px',gap:24,overflowY:'auto',
    }}>
      <SidebarBrand />
      {GRUPOS.map(g => (
        <div key={g.id} style={{display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontSize:11,fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:C.tintaSuave,padding:'8px 12px 6px'}}>{g.label}</span>
          {NAV_ITEMS.filter(i => i.grupo === g.id).map(item => (
            <SidebarNavItem
              key={item.page}
              icon={item.icon}
              label={item.label}
              active={activePage===item.page}
              badgeCount={item.badge ? pendingCount : 0}
              onClick={() => onNav(item.page)}
            />
          ))}
        </div>
      ))}
      <div style={{flex:1}}/>
      <SidebarNavItem icon="logout" label="Salir" onClick={onLogout} />
    </nav>
  );
}
