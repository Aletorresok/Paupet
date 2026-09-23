export default function SidebarNavItem({ icon, label, active, badgeCount, onClick, muted }) {
  return (
    <div onClick={onClick} style={{
      display:'flex',alignItems:'center',gap:9,padding:'10px 12px',borderRadius:10,cursor:'pointer',
      fontSize:13,fontWeight:active?500:400,
      background:active?'white':'transparent',
      color:active?'#2e2828':muted?'rgba(255,255,255,.6)':'rgba(255,255,255,.85)',
      boxShadow:active?'0 4px 20px rgba(0,0,0,.08)':'none',
      transition:'all .2s',
    }}>
      <span style={{fontSize:15,width:20,textAlign:'center',flexShrink:0}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badgeCount > 0 && (
        <span style={{background:'#e8809a',color:'white',fontSize:10,fontWeight:600,borderRadius:20,padding:'2px 6px',minWidth:18,textAlign:'center'}}>{badgeCount}</span>
      )}
    </div>
  );
}
