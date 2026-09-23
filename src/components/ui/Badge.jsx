const badgeColors = {
  green:  {bg:'#dff5ec',color:'#3a9b7b'},
  pink:   {bg:'#fde8ed',color:'#e8809a'},
  orange: {bg:'#fff3e0',color:'#e6860a'},
  gray:   {bg:'#f0eeed',color:'#9a9090'},
  blue:   {bg:'#e3f0ff',color:'#3a7bd5'},
};

export default function Badge({ variant, children }) {
  const c = badgeColors[variant] || badgeColors.gray;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{children}</span>;
}
