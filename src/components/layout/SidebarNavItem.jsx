import { C } from '../../lib/styles';
import Icon from '../ui/Icon';

export default function SidebarNavItem({ icon, label, active, badgeCount, badgeLabel = 'pend.', onClick }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} style={{
      display:'flex',alignItems:'center',gap:12,height:44,padding:'0 12px',borderRadius:10,cursor:'pointer',
      fontSize:15,fontWeight:active?600:400,border:'none',width:'100%',textAlign:'left',fontFamily:'inherit',
      background:active?C.mentaSuave:'transparent',
      color:active?C.verde:C.tinta,
      transition:'background .15s',
    }}>
      <Icon name={icon} size={20} />
      <span style={{flex:1}}>{label}</span>
      {badgeCount > 0 && (
        <span style={{background:C.rosaSuave,color:C.rosa,fontSize:12,fontWeight:600,borderRadius:999,padding:'2px 8px'}}>{badgeCount} {badgeLabel}</span>
      )}
    </button>
  );
}
