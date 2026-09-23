import { useResp } from '../../context/resp';
import { NAV_ITEMS } from '../../lib/constants';
import SidebarBrand from './SidebarBrand';
import SidebarNavItem from './SidebarNavItem';

export default function Sidebar({ activePage, onNav, pendingCount, mobileOpen, onMobileClose, onLogout }) {
  const { isMob } = useResp();
  const handleNav = (p) => { onNav(p); if (isMob) onMobileClose(); };

  const inner = (
    <nav style={{
      width: isMob ? 240 : 220, minWidth: isMob ? 240 : 220, height:'100%',
      background:'linear-gradient(180deg,#4caf8e 0%,#5fbf9b 40%,#c5879a 100%)',
      display:'flex', flexDirection:'column', padding:'20px 12px',
      position:'relative', zIndex:20, boxShadow:'4px 0 24px rgba(0,0,0,.08)', overflow:'hidden',
    }}>
      <div style={{position:'absolute',top:-60,right:-60,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>

      {isMob && (
        <button onClick={onMobileClose} style={{
          position:'absolute',top:14,right:14,zIndex:10,width:28,height:28,
          background:'rgba(255,255,255,.25)',border:'none',borderRadius:'50%',
          color:'white',fontSize:14,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>✕</button>
      )}

      <SidebarBrand />

      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,position:'relative',zIndex:1,overflowY:'auto'}}>
        {NAV_ITEMS.map(item => (
          <SidebarNavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            active={activePage===item.page}
            badgeCount={item.badge ? pendingCount : 0}
            onClick={() => handleNav(item.page)}
          />
        ))}
      </div>

      <div style={{position:'relative',zIndex:1,marginTop:8}}>
        <SidebarNavItem icon="🚪" label="Salir" onClick={onLogout} muted />
      </div>
    </nav>
  );

  if (!isMob) return inner;
  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose} style={{position:'fixed',inset:0,zIndex:997,background:'rgba(0,0,0,.5)',backdropFilter:'blur(2px)'}}/>
      )}
      <div style={{
        position:'fixed',top:0,left:0,bottom:0,zIndex:998,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>
        {inner}
      </div>
    </>
  );
}
